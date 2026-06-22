'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FREE_PLAN_NAME,
  FREE_PLAN_PRICE_DISPLAY,
  MAX_PLAN_BENEFITS,
  MAX_PLAN_MARKETING,
  PLAN_COMPARISON_ROWS,
  PLAN_FEATURES,
} from '@/lib/constants/plans';
import {
  MAX_PLAN_NAME,
  MAX_PLAN_TRIAL_DAYS,
  type UserSubscriptionSummary,
} from '@/lib/constants/subscriptions';
import AprovIALogo from '@/app/components/shared/AprovIALogo';

type SubscriptionStatusPayload = {
  authenticated: boolean;
  subscription: UserSubscriptionSummary;
  error?: string;
};

const PLANOS_RETURN_PATH = '/planos';

const DEFAULT_SUBSCRIPTION: UserSubscriptionSummary = {
  planCode: 'free',
  planName: FREE_PLAN_NAME,
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

function CheckIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M16.25 5.75 8.5 13.5 4.75 9.75"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 11.55 7.3 16.5 8.85 11.55 10.4 10 15.5 8.45 10.4 3.5 8.85 8.45 7.3 10 2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2.5 16 5v4.4c0 3.45-2.45 6.65-6 7.6-3.55-.95-6-4.15-6-7.6V5l6-2.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="m7.5 9.9 1.55 1.55L12.9 7.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function formatDate(value: string | null) {
  if (!value) return 'Não agendada';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Não agendada';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(parsed);
}

function getStatusLabel(subscription: UserSubscriptionSummary) {
  if (subscription.hasMaxAccess) {
    return subscription.status === 'trialing' ? 'Teste Max ativo' : 'Max ativo';
  }

  if (subscription.status === 'checkout_pending') return 'Checkout pendente';
  if (subscription.status === 'past_due') return 'Pagamento pendente';
  if (subscription.status === 'unpaid') return 'Pagamento não confirmado';
  if (subscription.status === 'canceled') return 'Assinatura cancelada';
  return 'Plano gratuito';
}

function getActionLabel(subscription: UserSubscriptionSummary) {
  if (subscription.hasMaxAccess) return 'Gerenciar assinatura';
  if (subscription.status === 'checkout_pending') return 'Continuar checkout';
  if (subscription.trialEligible) return `Começar ${subscription.trialDays ?? MAX_PLAN_TRIAL_DAYS} dias grátis`;
  return 'Assinar Max';
}

function PlanFeatureList({ items, accent }: { items: readonly string[]; accent: 'muted' | 'max' }) {
  return (
    <ul className="mt-7 space-y-3 text-sm">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[var(--text-2)]">
          <span
            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
              accent === 'max'
                ? 'bg-[var(--brand)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-3)]'
            }`}
          >
            <CheckIcon />
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PlanosPageClient() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<SubscriptionStatusPayload>({
    authenticated: false,
    subscription: DEFAULT_SUBSCRIPTION,
  });
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [action, setAction] = useState<'checkout' | 'portal' | null>(null);
  const [error, setError] = useState('');

  const subscriptionState = searchParams.get('subscription');

  const fetchStatus = useCallback(async () => {
    setLoadingStatus(true);
    setError('');

    try {
      const response = await fetch('/api/assinatura/status', {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.subscription) {
        throw new Error(payload?.error || 'Não foi possível carregar sua assinatura.');
      }

      setStatus(payload as SubscriptionStatusPayload);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível carregar sua assinatura.');
    } finally {
      setLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (subscriptionState === 'success') {
      const timer = window.setTimeout(() => {
        void fetchStatus();
      }, 2500);

      return () => window.clearTimeout(timer);
    }

    return undefined;
  }, [fetchStatus, subscriptionState]);

  const subscription = status.subscription;
  const hasStripeCustomer = Boolean(subscription.stripeCustomerId);
  const statusMessage = useMemo(() => {
    if (subscriptionState === 'success') {
      return 'Checkout concluído. A sincronização da assinatura pode levar alguns segundos.';
    }

    if (subscriptionState === 'canceled') {
      return 'Checkout cancelado. Você pode retomar a assinatura quando quiser.';
    }

    return '';
  }, [subscriptionState]);

  async function handleCheckout() {
    if (!status.authenticated) return;

    setAction('checkout');
    setError('');

    try {
      const response = await fetch('/api/assinatura/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: PLANOS_RETURN_PATH }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Não foi possível iniciar a assinatura.');
      }

      if (!payload?.url) {
        throw new Error('Stripe não retornou uma URL de checkout.');
      }

      window.location.href = payload.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível iniciar a assinatura.');
      setAction(null);
    }
  }

  async function handlePortal() {
    setAction('portal');
    setError('');

    try {
      const response = await fetch('/api/assinatura/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnPath: PLANOS_RETURN_PATH }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || payload?.error || 'Não foi possível abrir o portal da assinatura.');
      }

      if (!payload?.url) {
        throw new Error('Stripe não retornou uma URL de portal.');
      }

      window.location.href = payload.url;
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Não foi possível abrir o portal da assinatura.');
      setAction(null);
    }
  }

  const primaryAction = subscription.hasMaxAccess && hasStripeCustomer ? handlePortal : handleCheckout;
  const isPrimaryDisabled =
    loadingStatus ||
    action !== null ||
    (subscription.hasMaxAccess && !hasStripeCustomer);

  return (
    <div className="overflow-hidden">
      <section className="border-b border-[var(--border)] bg-[var(--bg)]">
        <div className="container grid min-h-[calc(100dvh-4rem)] items-center gap-12 py-16 lg:grid-cols-[1fr_0.9fr] lg:py-24">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">
              <SparkIcon />
              AprovIA Max
            </span>
            <h1 className="mt-7 text-4xl font-semibold tracking-tight text-[var(--text)] sm:text-5xl lg:text-6xl">
              Uma preparação mais inteligente para quem quer ir além do gratuito.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-2)]">
              Compare os planos e escolha a experiência certa para estudar redação, temas e simulados com IA no mesmo ambiente.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              {status.authenticated ? (
                <button
                  type="button"
                  onClick={() => void primaryAction()}
                  disabled={isPrimaryDisabled}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === 'checkout'
                    ? 'Abrindo checkout...'
                    : action === 'portal'
                      ? 'Abrindo portal...'
                      : getActionLabel(subscription)}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-hover)]"
                >
                  Criar conta e testar Max
                </Link>
              )}
              <Link
                href={status.authenticated ? '/conta' : '/login'}
                className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                {status.authenticated ? 'Ver minha conta' : 'Entrar'}
              </Link>
            </div>
            {(statusMessage || error) && (
              <p
                className={`mt-5 rounded-xl border px-4 py-3 text-sm ${
                  error
                    ? 'border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]'
                    : 'border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]'
                }`}
              >
                {error || statusMessage}
              </p>
            )}
          </div>

          <div className="relative">
            <div className="rounded-[2rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-5">
                <AprovIALogo size="md" />
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  {MAX_PLAN_NAME}
                </span>
              </div>
              <div className="grid gap-4 pt-5 sm:grid-cols-2">
                {MAX_PLAN_BENEFITS.map((benefit) => (
                  <div key={benefit.title} className="rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-4">
                    <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand)] text-white">
                      <SparkIcon />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--text)]">{benefit.title}</h3>
                    <p className="mt-2 text-xs leading-relaxed text-[var(--text-3)]">{benefit.description}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Status</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">
                      {loadingStatus ? 'Carregando...' : getStatusLabel(subscription)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--text-3)]">Renovação</p>
                    <p className="mt-1 text-sm font-semibold text-[var(--text)]">{formatDate(subscription.renewsAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-16 md:py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)] md:text-4xl">
              Free para começar. Max para acelerar.
            </h2>
            <p className="mt-4 text-base text-[var(--text-2)]">
              O gratuito continua útil. O Max adiciona uma camada premium para quem quer uma rotina de estudo mais personalizada.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <article className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
              <p className="text-sm font-semibold text-[var(--text-3)]">{FREE_PLAN_NAME}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-[var(--text)]">{FREE_PLAN_PRICE_DISPLAY}</span>
                <span className="pb-1 text-sm text-[var(--text-3)]">para usar</span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-2)]">
                Ideal para começar a praticar redações, simulados e acompanhar seu histórico.
              </p>
              <PlanFeatureList items={PLAN_FEATURES.free} accent="muted" />
              <Link
                href="/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] px-5 py-3 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                Começar gratuito
              </Link>
            </article>

            <article className="rounded-[1.5rem] border border-[var(--brand)]/40 bg-[var(--surface)] p-6 shadow-xl md:p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-[var(--brand)]">{MAX_PLAN_MARKETING.name}</p>
                <span className="rounded-full bg-[var(--brand)] px-3 py-1 text-xs font-semibold text-white">
                  Mais escolhido
                </span>
              </div>
              <div className="mt-4 flex items-end gap-2">
                <span className="text-4xl font-semibold tracking-tight text-[var(--text)]">{MAX_PLAN_MARKETING.price}</span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-2)]">{MAX_PLAN_MARKETING.tagline}</p>
              <PlanFeatureList items={PLAN_FEATURES.max} accent="max" />
              {status.authenticated ? (
                <button
                  type="button"
                  onClick={() => void primaryAction()}
                  disabled={isPrimaryDisabled}
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === 'checkout'
                    ? 'Abrindo checkout...'
                    : action === 'portal'
                      ? 'Abrindo portal...'
                      : getActionLabel(subscription)}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[var(--brand)] px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
                >
                  Criar conta e testar Max
                </Link>
              )}
            </article>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
                Comparação direta
              </h2>
              <p className="mt-3 max-w-2xl text-sm text-[var(--text-2)]">
                Sem prometer uso ilimitado: o Max melhora a qualidade e a personalização da IA, mantendo os limites de segurança da plataforma.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-[var(--text-2)]">
              <ShieldIcon />
              Stripe seguro
            </span>
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
            <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr] border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-3)] sm:px-6">
              <span>Recurso</span>
              <span>{FREE_PLAN_NAME}</span>
              <span>{MAX_PLAN_NAME}</span>
            </div>
            {PLAN_COMPARISON_ROWS.map((row) => (
              <div
                key={row.feature}
                className="grid grid-cols-[1.2fr_0.9fr_0.9fr] gap-3 border-b border-[var(--border)] px-4 py-4 text-sm last:border-b-0 sm:px-6"
              >
                <span className="font-medium text-[var(--text)]">{row.feature}</span>
                <span className="text-[var(--text-2)]">{row.free}</span>
                <span className="font-semibold text-[var(--brand)]">{row.max}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--border)] bg-[var(--surface)] py-16 md:py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-[var(--text)]">
              Pronto para testar o Max?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-sm text-[var(--text-2)]">
              Comece pelo teste grátis, acompanhe o status nesta página e gerencie tudo pelo portal seguro do Stripe.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {status.authenticated ? (
                <button
                  type="button"
                  onClick={() => void primaryAction()}
                  disabled={isPrimaryDisabled}
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === 'checkout'
                    ? 'Abrindo checkout...'
                    : action === 'portal'
                      ? 'Abrindo portal...'
                      : getActionLabel(subscription)}
                </button>
              ) : (
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center rounded-xl bg-[var(--brand)] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[var(--brand-hover)]"
                >
                  Criar conta e testar Max
                </Link>
              )}
              {status.authenticated && hasStripeCustomer && !subscription.hasMaxAccess && (
                <button
                  type="button"
                  onClick={() => void handlePortal()}
                  disabled={action !== null}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {action === 'portal' ? 'Abrindo portal...' : 'Gerenciar no Stripe'}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
