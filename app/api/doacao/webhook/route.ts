import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/db/server';
import { getStripe, getStripeStringId } from '@/lib/server/stripe';
import type { Json } from '@/types/supabase';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type WebhookProcessResult = {
  checkoutSessionId: string | null;
  clientReferenceId: string | null;
  status: 'processed' | 'ignored';
  reason?: string;
};

function getClientReferenceId(session: Stripe.Checkout.Session) {
  const rawReference = session.client_reference_id ?? session.metadata?.donation_checkout_id ?? null;
  if (!rawReference || !UUID_RE.test(rawReference)) {
    return null;
  }

  return rawReference;
}

function isUniqueViolation(error: { code?: string } | null) {
  return error?.code === '23505';
}

async function updateWebhookEvent(
  stripeEventId: string,
  payload: {
    status: 'processed' | 'ignored' | 'failed';
    errorMessage?: string | null;
  }
) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return;
  }

  await adminClient
    .from('stripe_webhook_events')
    .update({
      status: payload.status,
      error_message: payload.errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', stripeEventId);
}

async function handleCheckoutSessionEvent(event: Stripe.Event): Promise<WebhookProcessResult> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Serviço de doação indisponível.');
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const clientReferenceId = getClientReferenceId(session);
  if (!clientReferenceId) {
    return {
      checkoutSessionId: session.id,
      clientReferenceId: null,
      status: 'ignored',
      reason: 'missing_client_reference_id',
    };
  }

  const nowIso = new Date().toISOString();
  const eventCreatedAt = new Date(event.created * 1000).toISOString();
  const sessionStatus =
    event.type === 'checkout.session.completed'
      ? session.payment_status === 'paid'
        ? 'paid'
        : 'checkout_completed'
      : event.type === 'checkout.session.expired'
        ? 'expired'
        : 'payment_failed';

  const payload = {
    client_reference_id: clientReferenceId,
    stripe_checkout_session_id: session.id,
    stripe_payment_intent_id: getStripeStringId(session.payment_intent),
    stripe_customer_id: getStripeStringId(session.customer),
    donor_email: session.customer_details?.email ?? session.customer_email ?? null,
    donor_name: session.customer_details?.name ?? null,
    amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? 'brl',
    status: sessionStatus,
    checkout_url: session.url ?? null,
    failure_reason:
      event.type === 'checkout.session.expired'
        ? 'checkout_expired'
        : event.type === 'checkout.session.async_payment_failed'
          ? 'async_payment_failed'
          : null,
    latest_event_id: event.id,
    latest_event_type: event.type,
    latest_event_created_at: eventCreatedAt,
    expires_at: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    completed_at: event.type === 'checkout.session.completed' ? nowIso : null,
    paid_at: session.payment_status === 'paid' ? nowIso : null,
    metadata: (session.metadata ?? {}) as unknown as Json,
    stripe_customer_details: (session.customer_details ?? null) as unknown as Json,
    session_payload: session as unknown as Json,
  };

  const { error } = await adminClient
    .from('donation_checkouts')
    .upsert(payload, { onConflict: 'client_reference_id' });

  if (error) {
    throw new Error(`Falha ao atualizar checkout da doação: ${error.message}`);
  }

  return {
    checkoutSessionId: session.id,
    clientReferenceId,
    status: 'processed',
  };
}

async function handlePaymentIntentFailed(event: Stripe.Event): Promise<WebhookProcessResult> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Serviço de doação indisponível.');
  }

  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const failureReason = paymentIntent.last_payment_error?.message ?? 'payment_intent_failed';

  const { error } = await adminClient
    .from('donation_checkouts')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      status: 'payment_failed',
      failure_reason: failureReason,
      latest_event_id: event.id,
      latest_event_type: event.type,
      latest_event_created_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id);

  if (error) {
    throw new Error(`Falha ao registrar pagamento recusado: ${error.message}`);
  }

  return {
    checkoutSessionId: null,
    clientReferenceId: null,
    status: 'processed',
  };
}

async function processDonationEvent(event: Stripe.Event): Promise<WebhookProcessResult> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      return handleCheckoutSessionEvent(event);
    case 'payment_intent.payment_failed':
      return handlePaymentIntentFailed(event);
    default:
      return {
        checkoutSessionId: null,
        clientReferenceId: null,
        status: 'ignored',
        reason: `event_type_not_handled:${event.type}`,
      };
  }
}

export async function POST(request: NextRequest) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Serviço de doação indisponível.' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
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

  const eventCreatedAt = new Date(event.created * 1000).toISOString();
  const checkoutSessionId =
    event.type.startsWith('checkout.session.')
      ? (event.data.object as Stripe.Checkout.Session).id
      : null;
  const clientReferenceId =
    event.type.startsWith('checkout.session.')
      ? getClientReferenceId(event.data.object as Stripe.Checkout.Session)
      : null;

  const { error: insertError } = await adminClient.from('stripe_webhook_events').insert({
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    api_version: event.api_version ?? null,
    checkout_session_id: checkoutSessionId,
    client_reference_id: clientReferenceId,
    event_created_at: eventCreatedAt,
    status: 'received',
    payload: event as unknown as Json,
  });

  if (isUniqueViolation(insertError)) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (insertError) {
    console.error('Erro ao persistir evento do Stripe:', insertError);
    return NextResponse.json(
      { error: 'Falha ao persistir evento do Stripe.' },
      { status: 500 }
    );
  }

  try {
    const result = await processDonationEvent(event);

    await updateWebhookEvent(event.id, {
      status: result.status,
      errorMessage: result.reason ?? null,
    });

    return NextResponse.json({
      received: true,
      status: result.status,
      reason: result.reason ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao processar webhook.';
    console.error('Erro ao processar webhook do Stripe:', error);
    await updateWebhookEvent(event.id, {
      status: 'failed',
      errorMessage: message,
    });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
