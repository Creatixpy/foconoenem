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
    apiVersion: '2025-11-17.clover',
  });

  return stripeClient;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Assinatura ou segredo do webhook não encontrado' },
        { status: 400 }
      );
    }

    let event: Stripe.Event;

    try {
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('Erro na verificação do webhook:', errorMessage);
      return NextResponse.json(
        { error: `Webhook Error: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Processar o evento
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Doação completada:', {
          sessionId: session.id,
          amount: session.amount_total,
          currency: session.currency,
        });

        // Aqui você pode adicionar lógica adicional, como:
        // - Salvar a doação no banco de dados
        // - Enviar email de confirmação
        // - Atualizar estatísticas, etc.

        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Pagamento bem-sucedido:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Falha no pagamento:', paymentIntent.id);
        break;
      }

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}
