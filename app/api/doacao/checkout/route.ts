import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

let stripeClient: Stripe | null = null;

function getStripe() {
  if (stripeClient) {
    return stripeClient;
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY não configurada.');
  }

  stripeClient = new Stripe(secretKey, {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    apiVersion: '2025-09-30.clover' as any,
  });

  return stripeClient;
}

export async function POST(request: NextRequest) {
  try {
    const { amount } = await request.json();

    // Validar o valor da doação (mínimo R$ 5)
    if (!amount || amount < 5) {
      return NextResponse.json(
        { error: 'Valor mínimo de doação é R$ 5,00' },
        { status: 400 }
      );
    }

    // Criar sessão de checkout do Stripe
    const stripe = getStripe();
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
      success_url: `${request.headers.get('origin')}/doacao/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.headers.get('origin')}/doacao?canceled=true`,
      metadata: {
        type: 'donation',
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pagamento' },
      { status: 500 }
    );
  }
}
