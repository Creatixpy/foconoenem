import 'server-only';

import type { User } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import {
  MAX_ACCESS_STATUSES,
  MAX_PLAN_CODE,
  MAX_PLAN_NAME,
  MAX_PLAN_TRIAL_DAYS,
  type SubscriptionStatus,
  type UserSubscriptionSummary,
} from '@/lib/constants/subscriptions';
import { createAdminClient } from '@/lib/db/server';
import { getStripe, getStripeStringId } from '@/lib/server/stripe';
import type { Database, Json } from '@/types/supabase';

type AdminClient = SupabaseClient<Database>;
type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert'];
type SubscriptionEventInsert = Database['public']['Tables']['subscription_events']['Insert'];

type SyncSubscriptionHints = {
  checkoutSessionId?: string | null;
  checkoutExpiresAt?: string | null;
  userIdHint?: string | null;
  metadata?: Record<string, Json>;
};

const SUBSCRIPTION_WEBHOOK_EVENTS = new Set([
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
]);

function isJsonRecord(value: Json | null | undefined): value is Record<string, Json> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function mergeMetadata(
  ...sources: Array<Record<string, Json> | Json | null | undefined>
): Record<string, Json> {
  const merged: Record<string, Json> = {};

  for (const source of sources) {
    if (!isJsonRecord(source)) continue;
    Object.assign(merged, source);
  }

  return merged;
}

function toIsoString(timestamp: number | null | undefined) {
  if (!timestamp || !Number.isFinite(timestamp)) {
    return null;
  }

  return new Date(timestamp * 1000).toISOString();
}

function getStripeMetadataValue(metadata: Stripe.Metadata | null | undefined, key: string) {
  const value = metadata?.[key];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function getStripeSubscriptionPriceId(subscription: Stripe.Subscription) {
  return subscription.items.data[0]?.price?.id ?? null;
}

function getStripeSubscriptionPeriodValue(
  subscription: Stripe.Subscription,
  key: 'current_period_start' | 'current_period_end'
) {
  const source = subscription as Stripe.Subscription & Partial<Record<'current_period_start' | 'current_period_end', number>>;
  if (typeof source[key] === 'number') {
    return source[key];
  }

  const itemSource = subscription.items.data[0] as Partial<Record<'current_period_start' | 'current_period_end', number>> | undefined;
  return typeof itemSource?.[key] === 'number' ? itemSource[key] : null;
}

function getStripeSubscriptionTrialValue(
  subscription: Stripe.Subscription,
  key: 'trial_start' | 'trial_end'
) {
  const source = subscription as Stripe.Subscription & Partial<Record<'trial_start' | 'trial_end', number>>;
  return typeof source[key] === 'number' ? source[key] : null;
}

function getInvoiceSubscriptionId(invoice: Stripe.Invoice) {
  const source = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  return getStripeStringId(source.subscription ?? null);
}

function normalizeSubscriptionStatus(status: Stripe.Subscription.Status): SubscriptionStatus {
  if (status === 'active') return 'active';
  if (status === 'canceled') return 'canceled';
  if (status === 'incomplete') return 'incomplete';
  if (status === 'incomplete_expired') return 'incomplete_expired';
  if (status === 'past_due') return 'past_due';
  if (status === 'paused') return 'paused';
  if (status === 'trialing') return 'trialing';
  if (status === 'unpaid') return 'unpaid';

  return 'incomplete';
}

export function hasMaxPlanAccess(subscription: Pick<SubscriptionRow, 'plan_code' | 'status' | 'current_period_end'> | null) {
  if (!subscription || subscription.plan_code !== MAX_PLAN_CODE) {
    return false;
  }

  if (!MAX_ACCESS_STATUSES.includes(subscription.status as (typeof MAX_ACCESS_STATUSES)[number])) {
    return false;
  }

  const accessEndsAt = getSubscriptionAccessEnd(subscription);
  if (!accessEndsAt) {
    return false;
  }

  return accessEndsAt.getTime() > Date.now();
}

function getMetadataTimestamp(metadata: Json | null | undefined, key: string) {
  if (!isJsonRecord(metadata)) {
    return null;
  }

  const rawValue = metadata[key];
  if (typeof rawValue !== 'string' || !rawValue.trim()) {
    return null;
  }

  const parsed = new Date(rawValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function getSubscriptionAccessEnd(
  subscription: Pick<SubscriptionRow, 'current_period_end'> & { metadata?: Json | null }
) {
  if (subscription.current_period_end) {
    const parsed = new Date(subscription.current_period_end);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return getMetadataTimestamp(subscription.metadata, 'trial_ends_at');
}

function getSubscriptionAccessEndIso(subscription: SubscriptionRow) {
  return getSubscriptionAccessEnd(subscription)?.toISOString() ?? null;
}

function hasUsedMaxTrial(
  subscription: Pick<SubscriptionRow, 'metadata' | 'status' | 'stripe_subscription_id'> | null
) {
  if (!subscription) {
    return false;
  }

  if (subscription.status === 'trialing') {
    return true;
  }

  if (subscription.stripe_subscription_id) {
    return true;
  }

  const metadata = subscription.metadata;
  if (!isJsonRecord(metadata)) {
    return false;
  }

  return typeof metadata.trial_used_at === 'string' && metadata.trial_used_at.trim().length > 0;
}

export function canStartMaxTrial(
  subscription: Pick<SubscriptionRow, 'metadata' | 'status' | 'stripe_subscription_id'> | null
) {
  return !hasUsedMaxTrial(subscription);
}

export function buildFreeSubscriptionSummary(): UserSubscriptionSummary {
  return {
    planCode: 'free',
    planName: 'Gratuito',
    provider: null,
    status: 'free',
    hasMaxAccess: false,
    trialEligible: true,
    trialDays: MAX_PLAN_TRIAL_DAYS,
    cancelAtPeriodEnd: false,
    currentPeriodEnd: null,
    renewsAt: null,
    canceledAt: null,
    latestCheckoutSessionId: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    stripePriceId: null,
  };
}

export function toSubscriptionSummary(subscription: SubscriptionRow | null): UserSubscriptionSummary {
  if (!subscription) {
    return buildFreeSubscriptionSummary();
  }

  return {
    planCode: subscription.plan_code === MAX_PLAN_CODE ? MAX_PLAN_CODE : 'free',
    planName: subscription.plan_name || MAX_PLAN_NAME,
    provider: subscription.provider === 'stripe' ? 'stripe' : null,
    status: subscription.status as SubscriptionStatus,
    hasMaxAccess: hasMaxPlanAccess(subscription),
    trialEligible: canStartMaxTrial(subscription),
    trialDays: MAX_PLAN_TRIAL_DAYS,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    currentPeriodEnd: getSubscriptionAccessEndIso(subscription),
    renewsAt: subscription.renews_at ?? getSubscriptionAccessEndIso(subscription),
    canceledAt: subscription.canceled_at,
    latestCheckoutSessionId: subscription.latest_checkout_session_id,
    stripeCustomerId: subscription.stripe_customer_id,
    stripeSubscriptionId: subscription.stripe_subscription_id,
    stripePriceId: subscription.stripe_price_id,
  };
}

export function getMaxSubscriptionPriceId() {
  const priceId = process.env.STRIPE_MAX_PRICE_ID;
  if (!priceId) {
    throw new Error('STRIPE_MAX_PRICE_ID não configurada.');
  }

  return priceId;
}

export function isSubscriptionWebhookEvent(event: Stripe.Event) {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    return session.mode === 'subscription' || session.metadata?.plan_code === MAX_PLAN_CODE;
  }

  return SUBSCRIPTION_WEBHOOK_EVENTS.has(event.type);
}

export async function getUserSubscription(
  adminClient: AdminClient,
  userId: string
): Promise<SubscriptionRow | null> {
  const { data, error } = await adminClient
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao carregar assinatura: ${error.message}`);
  }

  return data;
}

export async function getUserSubscriptionSummary(userId: string) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Supabase service role não configurado.');
  }

  const subscription = await getUserSubscription(adminClient, userId);
  return toSubscriptionSummary(subscription);
}

async function findSubscriptionByStripeRefs(
  adminClient: AdminClient,
  refs: {
    stripeSubscriptionId?: string | null;
    stripeCustomerId?: string | null;
    userId?: string | null;
  }
) {
  if (refs.stripeSubscriptionId) {
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('stripe_subscription_id', refs.stripeSubscriptionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar assinatura por subscription_id: ${error.message}`);
    }

    if (data) return data;
  }

  if (refs.userId) {
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', refs.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar assinatura por user_id: ${error.message}`);
    }

    if (data) return data;
  }

  if (refs.stripeCustomerId) {
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .eq('stripe_customer_id', refs.stripeCustomerId)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao buscar assinatura por customer_id: ${error.message}`);
    }

    if (data) return data;
  }

  return null;
}

function extractUserIdFromExpandedCustomer(
  customer: string | Stripe.Customer | Stripe.DeletedCustomer | null
) {
  if (!customer || typeof customer === 'string' || customer.deleted) {
    return null;
  }

  return getStripeMetadataValue(customer.metadata, 'supabase_user_id');
}

export async function ensureStripeCustomerForUser(
  adminClient: AdminClient,
  user: User,
  existingSubscription: SubscriptionRow | null
) {
  const stripe = getStripe();
  const currentCustomerId = existingSubscription?.stripe_customer_id ?? null;

  if (currentCustomerId) {
    const existingCustomer = await stripe.customers.retrieve(currentCustomerId);
    if (typeof existingCustomer !== 'string' && !existingCustomer.deleted) {
      const owner = getStripeMetadataValue(existingCustomer.metadata, 'supabase_user_id');
      if (owner && owner !== user.id) {
        throw new Error('Cliente Stripe vinculado a outro usuário.');
      }

      return existingCustomer.id;
    }
  }

  const customer = await stripe.customers.create({
    email: user.email ?? undefined,
    metadata: {
      supabase_user_id: user.id,
      plan_code: MAX_PLAN_CODE,
    },
    name:
      typeof user.user_metadata?.nome_completo === 'string'
        ? user.user_metadata.nome_completo
        : typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : undefined,
  });

  const payload: SubscriptionInsert = {
    user_id: user.id,
    plan_code: MAX_PLAN_CODE,
    plan_name: MAX_PLAN_NAME,
    provider: 'stripe',
    status: existingSubscription?.status ?? 'checkout_pending',
    stripe_customer_id: customer.id,
    stripe_price_id: existingSubscription?.stripe_price_id ?? getMaxSubscriptionPriceId(),
    metadata: mergeMetadata(existingSubscription?.metadata, {
      customer_created_by: 'app',
    }),
  };

  const { error } = await adminClient
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Falha ao salvar customer Stripe: ${error.message}`);
  }

  return customer.id;
}

export async function savePendingSubscriptionCheckout(
  adminClient: AdminClient,
  input: {
    userId: string;
    stripeCustomerId: string;
    stripePriceId: string;
    checkoutSessionId: string;
    checkoutExpiresAt: string | null;
    metadata?: Record<string, Json>;
  }
) {
  const existing = await getUserSubscription(adminClient, input.userId).catch(() => null);
  const payload: SubscriptionInsert = {
    user_id: input.userId,
    plan_code: MAX_PLAN_CODE,
    plan_name: MAX_PLAN_NAME,
    provider: 'stripe',
    status: existing && hasMaxPlanAccess(existing) ? existing.status : 'checkout_pending',
    stripe_customer_id: input.stripeCustomerId,
    stripe_price_id: input.stripePriceId,
    latest_checkout_session_id: input.checkoutSessionId,
    latest_checkout_expires_at: input.checkoutExpiresAt,
    metadata: mergeMetadata(existing?.metadata, input.metadata, {
      last_checkout_session_id: input.checkoutSessionId,
    }),
  };

  const { error } = await adminClient
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' });

  if (error) {
    throw new Error(`Falha ao salvar checkout pendente: ${error.message}`);
  }
}

export async function insertSubscriptionEvent(
  adminClient: AdminClient,
  payload: SubscriptionEventInsert
) {
  const { error } = await adminClient.from('subscription_events').insert(payload);
  if (error?.code === '23505') {
    return { duplicate: true as const };
  }

  if (error) {
    throw new Error(`Falha ao persistir evento de assinatura: ${error.message}`);
  }

  return { duplicate: false as const };
}

export async function updateSubscriptionEvent(
  adminClient: AdminClient,
  stripeEventId: string,
  payload: {
    status: 'processed' | 'ignored' | 'failed';
    errorMessage?: string | null;
    subscriptionId?: string | null;
    userId?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    stripeCheckoutSessionId?: string | null;
  }
) {
  const { error } = await adminClient
    .from('subscription_events')
    .update({
      status: payload.status,
      error_message: payload.errorMessage ?? null,
      processed_at: new Date().toISOString(),
      subscription_id: payload.subscriptionId ?? null,
      user_id: payload.userId ?? null,
      stripe_customer_id: payload.stripeCustomerId ?? null,
      stripe_subscription_id: payload.stripeSubscriptionId ?? null,
      stripe_checkout_session_id: payload.stripeCheckoutSessionId ?? null,
    })
    .eq('stripe_event_id', stripeEventId);

  if (error) {
    throw new Error(`Falha ao atualizar evento de assinatura: ${error.message}`);
  }
}

async function upsertSubscriptionRecord(
  adminClient: AdminClient,
  payload: SubscriptionInsert
) {
  const { data, error } = await adminClient
    .from('subscriptions')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Falha ao sincronizar assinatura: ${error.message}`);
  }

  return data;
}

export async function upsertSubscriptionFromStripeObject(
  adminClient: AdminClient,
  subscription: Stripe.Subscription,
  hints: SyncSubscriptionHints = {}
) {
  const customerId = getStripeStringId(subscription.customer);
  const customerUserId = extractUserIdFromExpandedCustomer(subscription.customer);
  const existing = await findSubscriptionByStripeRefs(adminClient, {
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customerId,
    userId: hints.userIdHint ?? null,
  });

  const userId =
    getStripeMetadataValue(subscription.metadata, 'supabase_user_id') ??
    customerUserId ??
    existing?.user_id ??
    hints.userIdHint ??
    null;

  if (!userId) {
    throw new Error('Não foi possível determinar o usuário da assinatura Stripe.');
  }

  const normalizedStatus = normalizeSubscriptionStatus(subscription.status);
  const currentPeriodStart = toIsoString(getStripeSubscriptionPeriodValue(subscription, 'current_period_start'));
  const currentPeriodEnd = toIsoString(getStripeSubscriptionPeriodValue(subscription, 'current_period_end'));
  const trialStart = toIsoString(getStripeSubscriptionTrialValue(subscription, 'trial_start'));
  const trialEnd = toIsoString(getStripeSubscriptionTrialValue(subscription, 'trial_end'));
  const payload: SubscriptionInsert = {
    user_id: userId,
    plan_code: MAX_PLAN_CODE,
    plan_name: MAX_PLAN_NAME,
    provider: 'stripe',
    status: normalizedStatus,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: getStripeSubscriptionPriceId(subscription),
    latest_checkout_session_id: hints.checkoutSessionId ?? existing?.latest_checkout_session_id ?? null,
    latest_checkout_expires_at: hints.checkoutExpiresAt ?? existing?.latest_checkout_expires_at ?? null,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    renews_at: subscription.cancel_at_period_end ? null : currentPeriodEnd,
    cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    cancel_at: toIsoString(subscription.cancel_at),
    canceled_at: toIsoString(subscription.canceled_at),
    metadata: mergeMetadata(existing?.metadata, hints.metadata, {
      last_synced_from: 'stripe_webhook',
      latest_invoice_id: getStripeStringId(subscription.latest_invoice),
      ...(trialStart ? { trial_used_at: trialStart } : {}),
      ...(trialEnd ? { trial_ends_at: trialEnd } : {}),
      ...(trialStart || trialEnd ? { trial_days: MAX_PLAN_TRIAL_DAYS } : {}),
    }),
  };

  return upsertSubscriptionRecord(adminClient, payload);
}

export async function syncSubscriptionFromStripeId(
  adminClient: AdminClient,
  stripeSubscriptionId: string,
  hints: SyncSubscriptionHints = {}
) {
  const subscription = await getStripe().subscriptions.retrieve(stripeSubscriptionId, {
    expand: ['customer', 'items.data.price'],
  });

  return upsertSubscriptionFromStripeObject(adminClient, subscription, hints);
}

function extractCheckoutSessionUserId(session: Stripe.Checkout.Session) {
  const clientReference = session.client_reference_id;
  if (clientReference && /^[0-9a-f-]{36}$/i.test(clientReference)) {
    return clientReference;
  }

  return getStripeMetadataValue(session.metadata, 'supabase_user_id');
}

export function buildSubscriptionEventInsert(event: Stripe.Event): SubscriptionEventInsert | null {
  if (!isSubscriptionWebhookEvent(event)) {
    return null;
  }

  let stripeCustomerId: string | null = null;
  let stripeSubscriptionId: string | null = null;
  let stripeCheckoutSessionId: string | null = null;
  let userId: string | null = null;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    stripeCustomerId = getStripeStringId(session.customer);
    stripeSubscriptionId = getStripeStringId(session.subscription);
    stripeCheckoutSessionId = session.id;
    userId = extractCheckoutSessionUserId(session);
  } else if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    stripeCustomerId = getStripeStringId(subscription.customer);
    stripeSubscriptionId = subscription.id;
    userId = getStripeMetadataValue(subscription.metadata, 'supabase_user_id');
  } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    stripeCustomerId = getStripeStringId(invoice.customer);
    stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
  }

  return {
    stripe_event_id: event.id,
    event_type: event.type,
    livemode: event.livemode,
    api_version: event.api_version ?? null,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    stripe_checkout_session_id: stripeCheckoutSessionId,
    user_id: userId,
    event_created_at: new Date(event.created * 1000).toISOString(),
    status: 'received',
    payload: event as unknown as Json,
  };
}

export async function processSubscriptionWebhookEvent(
  adminClient: AdminClient,
  event: Stripe.Event
) {
  if (!isSubscriptionWebhookEvent(event)) {
    return {
      status: 'ignored' as const,
      reason: `event_type_not_handled:${event.type}`,
      subscription: null,
    };
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.mode !== 'subscription') {
      return {
        status: 'ignored' as const,
        reason: 'checkout_session_not_subscription',
        subscription: null,
      };
    }

    const stripeSubscriptionId = getStripeStringId(session.subscription);
    if (!stripeSubscriptionId) {
      throw new Error('Checkout de assinatura sem subscription_id.');
    }

    const synced = await syncSubscriptionFromStripeId(adminClient, stripeSubscriptionId, {
      checkoutSessionId: session.id,
      checkoutExpiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
      userIdHint: extractCheckoutSessionUserId(session),
      metadata: {
        checkout_completed_at: new Date(event.created * 1000).toISOString(),
      },
    });

    return {
      status: 'processed' as const,
      reason: null,
      subscription: synced,
    };
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object as Stripe.Subscription;
    const synced = await upsertSubscriptionFromStripeObject(adminClient, subscription, {
      metadata: {
        last_subscription_event: event.type,
      },
    });

    return {
      status: 'processed' as const,
      reason: null,
      subscription: synced,
    };
  }

  if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
    const invoice = event.data.object as Stripe.Invoice;
    const stripeSubscriptionId = getInvoiceSubscriptionId(invoice);
    if (!stripeSubscriptionId) {
      return {
        status: 'ignored' as const,
        reason: 'invoice_without_subscription',
        subscription: null,
      };
    }

    const synced = await syncSubscriptionFromStripeId(adminClient, stripeSubscriptionId, {
      metadata: {
        last_invoice_event: event.type,
        last_invoice_id: invoice.id,
      },
    });

    return {
      status: 'processed' as const,
      reason: null,
      subscription: synced,
    };
  }

  return {
    status: 'ignored' as const,
    reason: `event_type_not_handled:${event.type}`,
    subscription: null,
  };
}
