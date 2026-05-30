import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/db/server';
import {
  buildDonationEventInsert,
  isDonationStripeEvent,
  processDonationWebhookEvent,
  updateDonationEvent,
} from '@/lib/server/donations';
import { getStripe } from '@/lib/server/stripe';
import {
  buildSubscriptionEventInsert,
  insertSubscriptionEvent,
  isSubscriptionWebhookEvent,
  processSubscriptionWebhookEvent,
  updateSubscriptionEvent,
} from '@/lib/server/subscriptions';

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === '23505';
}

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Serviço de pagamentos indisponível.' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: 'Assinatura Stripe ausente.' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Assinatura do webhook não configurada.' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Falha na assinatura do webhook.';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (isSubscriptionWebhookEvent(event)) {
    const insertPayload = buildSubscriptionEventInsert(event);
    if (!insertPayload) {
      return NextResponse.json({ received: true, status: 'ignored' });
    }

    try {
      const inserted = await insertSubscriptionEvent(adminClient, insertPayload);
      if (inserted.duplicate) {
        return NextResponse.json({ received: true, duplicate: true });
      }

      const result = await processSubscriptionWebhookEvent(adminClient, event);
      await updateSubscriptionEvent(adminClient, event.id, {
        status: result.status,
        errorMessage: result.reason ?? null,
        subscriptionId: result.subscription?.id ?? null,
        userId: result.subscription?.user_id ?? null,
        stripeCustomerId: result.subscription?.stripe_customer_id ?? null,
        stripeSubscriptionId: result.subscription?.stripe_subscription_id ?? null,
        stripeCheckoutSessionId: result.subscription?.latest_checkout_session_id ?? null,
      });

      return NextResponse.json({
        received: true,
        status: result.status,
        reason: result.reason ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar assinatura.';
      try {
        await updateSubscriptionEvent(adminClient, event.id, {
          status: 'failed',
          errorMessage: message,
        });
      } catch (updateError) {
        console.error('Erro ao atualizar falha de assinatura no webhook:', updateError);
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  if (isDonationStripeEvent(event)) {
    const insertPayload = buildDonationEventInsert(event);
    if (!insertPayload) {
      return NextResponse.json({ received: true, status: 'ignored' });
    }

    const { error: insertError } = await adminClient.from('stripe_webhook_events').insert(insertPayload);
    if (isUniqueViolation(insertError)) {
      return NextResponse.json({ received: true, duplicate: true });
    }

    if (insertError) {
      return NextResponse.json(
        { error: 'Falha ao persistir evento de doação.' },
        { status: 500 }
      );
    }

    try {
      const result = await processDonationWebhookEvent(adminClient, event);
      await updateDonationEvent(adminClient, event.id, {
        status: result.status,
        errorMessage: result.reason ?? null,
      });

      return NextResponse.json({
        received: true,
        status: result.status,
        reason: result.reason ?? null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao processar doação.';
      try {
        await updateDonationEvent(adminClient, event.id, {
          status: 'failed',
          errorMessage: message,
        });
      } catch (updateError) {
        console.error('Erro ao atualizar falha de doação no webhook:', updateError);
      }

      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({
    received: true,
    status: 'ignored',
    reason: `event_type_not_handled:${event.type}`,
  });
}
