import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { getStripeStringId } from '@/lib/server/stripe';
import type { Database, Json } from '@/types/supabase';

type AdminClient = SupabaseClient<Database>;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DonationWebhookProcessResult = {
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

export function isDonationStripeEvent(event: Stripe.Event) {
  if (
    event.type === 'checkout.session.completed' ||
    event.type === 'checkout.session.expired' ||
    event.type === 'checkout.session.async_payment_failed'
  ) {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.mode === 'payment' || session.metadata?.type === 'donation';
  }

  if (event.type === 'payment_intent.payment_failed') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    return paymentIntent.metadata?.type === 'donation';
  }

  return false;
}

export function buildDonationEventInsert(event: Stripe.Event) {
  if (!isDonationStripeEvent(event)) {
    return null;
  }

  const checkoutSessionId =
    event.type.startsWith('checkout.session.')
      ? (event.data.object as Stripe.Checkout.Session).id
      : null;
  const clientReferenceId =
    event.type.startsWith('checkout.session.')
      ? getClientReferenceId(event.data.object as Stripe.Checkout.Session)
      : null;

  return {
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    api_version: event.api_version ?? null,
    checkout_session_id: checkoutSessionId,
    client_reference_id: clientReferenceId,
    event_created_at: new Date(event.created * 1000).toISOString(),
    status: 'received' as const,
    payload: event as unknown as Json,
  };
}

export async function claimDonationEvent(
  adminClient: AdminClient,
  payload: NonNullable<ReturnType<typeof buildDonationEventInsert>>
) {
  const { data, error } = await adminClient.rpc('claim_donation_event', {
    p_event: payload as unknown as Json,
  });

  if (error) {
    throw new Error(`Falha ao reivindicar evento de doação: ${error.message}`);
  }

  if (data !== 'claimed' && data !== 'duplicate' && data !== 'in_progress') {
    throw new Error('Estado inválido ao reivindicar evento de doação.');
  }

  return data;
}

export async function updateDonationEvent(
  adminClient: AdminClient,
  stripeEventId: string,
  payload: {
    status: 'processed' | 'ignored' | 'failed';
    errorMessage?: string | null;
  }
) {
  const { error } = await adminClient
    .from('stripe_webhook_events')
    .update({
      status: payload.status,
      error_message: payload.errorMessage ?? null,
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', stripeEventId);

  if (error) {
    throw new Error(`Falha ao atualizar evento de doação: ${error.message}`);
  }
}

async function handleCheckoutSessionEvent(
  adminClient: AdminClient,
  event: Stripe.Event
): Promise<DonationWebhookProcessResult> {
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

async function handlePaymentIntentFailed(
  adminClient: AdminClient,
  event: Stripe.Event
): Promise<DonationWebhookProcessResult> {
  const paymentIntent = event.data.object as Stripe.PaymentIntent;
  const failureReason = paymentIntent.last_payment_error?.message ?? 'payment_intent_failed';

  const { data, error } = await adminClient
    .from('donation_checkouts')
    .update({
      stripe_payment_intent_id: paymentIntent.id,
      status: 'payment_failed',
      failure_reason: failureReason,
      latest_event_id: event.id,
      latest_event_type: event.type,
      latest_event_created_at: new Date(event.created * 1000).toISOString(),
    })
    .eq('stripe_payment_intent_id', paymentIntent.id)
    .select('id');

  if (error) {
    throw new Error(`Falha ao registrar pagamento recusado: ${error.message}`);
  }

  if (!data?.length) {
    return {
      checkoutSessionId: null,
      clientReferenceId: null,
      status: 'ignored',
      reason: 'checkout_not_found_for_payment_intent',
    };
  }

  return {
    checkoutSessionId: null,
    clientReferenceId: null,
    status: 'processed',
  };
}

export async function processDonationWebhookEvent(
  adminClient: AdminClient,
  event: Stripe.Event
): Promise<DonationWebhookProcessResult> {
  switch (event.type) {
    case 'checkout.session.completed':
    case 'checkout.session.expired':
    case 'checkout.session.async_payment_failed':
      return handleCheckoutSessionEvent(adminClient, event);
    case 'payment_intent.payment_failed':
      return handlePaymentIntentFailed(adminClient, event);
    default:
      return {
        checkoutSessionId: null,
        clientReferenceId: null,
        status: 'ignored',
        reason: `event_type_not_handled:${event.type}`,
      };
  }
}
