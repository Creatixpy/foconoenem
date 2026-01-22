import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { z } from 'zod';
import { handleApiError } from '@/lib/security';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2025-11-17.clover' as any,
  });

  return stripeClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Sentinel Security: Input Hardening via Zod
    const { amount } = checkoutSchema.parse(body);

    // Criar sessão de checkout do Stripe
    const stripe = getStripe();

    // Sentinel Security: Strict Origin Validation
    // Prevent open redirect vulnerabilities by whitelisting the origin.
    const allowedOrigin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    let origin = request.headers.get('origin') || allowedOrigin;

    if (origin !== allowedOrigin) {
      // If origin doesn't match our site, fallback to safe internal URL (or reject, but fallback preserves flow for some setups)
      origin = allowedOrigin;
    }

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
