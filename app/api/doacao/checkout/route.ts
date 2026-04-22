import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { handleApiError } from '@/lib/security';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

// Sentinel Security: Validates the request body strictly
const checkoutSchema = z.object({
  amount: z.number().min(5, { message: 'Valor mínimo de doação é R$ 5,00' }).max(10000, { message: 'Valor excede o limite permitido por transação.' })
});

let stripeClient: Stripe | null = null;

function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    // Sentinel Security: Log this internally, but do not crash the request visibly with stack trace if possible in production (caught by wrapper)
    throw new Error('STRIPE_SECRET_KEY não configurada.');
  }

  stripeClient = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
  });

  return stripeClient;
}

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    // I18: Add rate limiting to checkout
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? "unknown";
    const rateResult = await checkRateLimit(ip, "/api/doacao/checkout", 5, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: "Muitas tentativas. Tente novamente em instantes." },
        { status: 429 }
      );
    }

    const body = await request.json();

    // Sentinel Security: Input Hardening via Zod
    const { amount } = checkoutSchema.parse(body);

    // Criar sessão de checkout do Stripe
    const stripe = getStripe();

    const origin = request.nextUrl.origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: 'Doação - Foco no ENEM',
              description: 'Sua doação ajuda a manter o projeto funcionando e ajudando estudantes a se prepararem para o ENEM!',
            },
            unit_amount: Math.round(amount * 100), // Stripe usa centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/doacao/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/doacao?canceled=true`,
      metadata: {
        type: 'donation',
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    // Sentinel Security: Blind Error Handling
    return handleApiError(error);
  }
}
