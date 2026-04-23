export const MAX_PLAN_CODE = 'max' as const;
export const MAX_PLAN_NAME = 'Max' as const;
export const MAX_PLAN_PRICE_CENTS = 1000;
export const MAX_PLAN_PRICE_DISPLAY = 'R$ 10,00/mês';

export const SUBSCRIPTION_STATUSES = [
  'checkout_pending',
  'incomplete',
  'incomplete_expired',
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'paused',
] as const;

export const MAX_ACCESS_STATUSES = ['active', 'trialing'] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];
export type MaxAccessStatus = (typeof MAX_ACCESS_STATUSES)[number];

export type SubscriptionPlanCode = typeof MAX_PLAN_CODE;

export type UserSubscriptionSummary = {
  planCode: SubscriptionPlanCode | 'free';
  planName: string;
  provider: 'stripe' | null;
  status: SubscriptionStatus | 'free';
  hasMaxAccess: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  renewsAt: string | null;
  canceledAt: string | null;
  latestCheckoutSessionId: string | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
};
