import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/server';
import { handleApiError } from '@/lib/security';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { getStripe, getStripeStringId } from '@/lib/server/stripe';
import type { Json } from '@/types/supabase';

const checkoutSchema = z.object({
  amount: z
    .number()
    .finite()
    .min(5, { message: 'Valor mínimo de doação é R$ 5,00.' })
    .max(10000, { message: 'Valor máximo por transação é R$ 10.000,00.' }),
});

export async function POST(request: NextRequest) {
  let checkoutId: string | null = null;
  const adminClient = createAdminClient();

  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    if (!adminClient) {
      return NextResponse.json(
        { error: 'Serviço de doação indisponível.' },
        { status: 500 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    const rateResult = await checkRateLimit(ip, '/api/doacao/checkout', 5, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { amount } = checkoutSchema.parse(body);
    const amountCents = Math.round(amount * 100);

    checkoutId = randomUUID();
    const origin = request.nextUrl.origin;
    const successUrl = `${origin}/doacao/sucesso?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/doacao?canceled=true`;

    const { error: insertError } = await adminClient.from('donation_checkouts').insert({
      client_reference_id: checkoutId,
      amount_cents: amountCents,
      currency: 'brl',
      status: 'checkout_created',
      request_ip: ip,
      request_user_agent: userAgent,
      metadata: {
        source: 'site',
        origin,
      } as Json,
      session_payload: {} as Json,
    });

    if (insertError) {
      throw new Error(`Falha ao registrar checkout: ${insertError.message}`);
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create(
      {
        mode: 'payment',
        client_reference_id: checkoutId,
        customer_creation: 'always',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          type: 'donation',
          donation_checkout_id: checkoutId,
        },
        payment_intent_data: {
          metadata: {
            type: 'donation',
            donation_checkout_id: checkoutId,
          },
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: 'brl',
              unit_amount: amountCents,
              product_data: {
                name: 'Doação - Foco no ENEM',
                description: 'Contribuição para manter a plataforma gratuita para estudantes.',
              },
            },
          },
        ],
        expand: ['payment_intent'],
      },
      {
        idempotencyKey: checkoutId,
      }
    );

    if (!session.url) {
      throw new Error('Stripe não retornou URL de checkout.');
    }

    const { error: updateError } = await adminClient
      .from('donation_checkouts')
      .update({
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: getStripeStringId(session.payment_intent),
        stripe_customer_id: getStripeStringId(session.customer),
        checkout_url: session.url,
        expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
        session_payload: session as unknown as Json,
      })
      .eq('client_reference_id', checkoutId);

    if (updateError) {
      throw new Error(`Falha ao atualizar checkout: ${updateError.message}`);
    }

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    if (checkoutId && adminClient) {
      const message = error instanceof Error ? error.message : 'Erro desconhecido';
      await adminClient
        .from('donation_checkouts')
        .update({
          status: 'checkout_failed',
          failure_reason: message,
        })
        .eq('client_reference_id', checkoutId);
    }

    return handleApiError(error);
  }
}
