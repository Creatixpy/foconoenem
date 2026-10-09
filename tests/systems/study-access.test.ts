import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserAiRuntime } from '../../lib/server/ai/provider';
import type { Database } from '../../types/supabase';

const dependencies = vi.hoisted(() => ({ subscription: vi.fn(), runtime: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/server', () => ({ createAdminClient: () => ({}) }));
vi.mock('@/lib/db/repositories/accounts', () => ({ getSubscriptionRecord: dependencies.subscription }));
vi.mock('@/lib/server/ai/provider', () => ({ getUserAiRuntime: dependencies.runtime }));

import { getOperatingHoursInfo, getUserOperatingHoursInfo } from '../../lib/server/operating-hours';
import { getStudyAiRuntime, StudyAccessError } from '../../lib/server/study-access';
import { toSubscriptionSummary } from '../../lib/server/subscriptions';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const outsideHours = new Date('2026-10-09T03:00:00Z'); // Midnight in São Paulo.
const expiresAt = '2026-10-10T03:00:00Z';

function subscription(changes: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: '5549594d-3889-4469-a2e8-e78d0abf1cdb', user_id: userId,
    plan_code: 'max', plan_name: 'Max', provider: 'stripe', status: 'active',
    current_period_end: expiresAt, current_period_start: null, metadata: {},
    cancel_at: null, cancel_at_period_end: false, canceled_at: null,
    created_at: '2026-10-01T12:00:00Z', updated_at: '2026-10-01T12:00:00Z',
    latest_checkout_expires_at: null, latest_checkout_session_id: null,
    renews_at: null, stripe_customer_id: null, stripe_price_id: null, stripe_subscription_id: null,
    ...changes,
  };
}

function runtime(row: SubscriptionRow | null): UserAiRuntime {
  return { subscription: toSubscriptionSummary(row), complete: vi.fn() };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(outsideHours);
});
afterEach(() => { vi.useRealTimers(); vi.resetAllMocks(); });

describe('horário autorizado pelo plano armazenado no banco', () => {
  it.each(['active', 'trialing'])('permite Max %s válido fora do horário sem carregar outra assinatura', async (status) => {
    const verifiedRuntime = runtime(subscription({ status }));
    dependencies.runtime.mockResolvedValue(verifiedRuntime);

    expect(await getStudyAiRuntime(userId)).toBe(verifiedRuntime);
    expect(dependencies.runtime).toHaveBeenCalledExactlyOnceWith(userId);
    expect(dependencies.subscription).not.toHaveBeenCalled();
    expect(verifiedRuntime.complete).not.toHaveBeenCalled();
  });

  it.each([
    null,
    subscription({ plan_code: 'free' }),
    subscription({ status: 'canceled' }),
    subscription({ status: 'unpaid' }),
    subscription({ status: 'past_due' }),
    subscription({ current_period_end: outsideHours.toISOString() }),
    subscription({ current_period_end: 'invalid' }),
  ])('recusa isenção sem Max vigente fora do horário: %j', async (row) => {
    const verifiedRuntime = runtime(row);
    dependencies.runtime.mockResolvedValue(verifiedRuntime);

    await expect(getStudyAiRuntime(userId)).rejects.toBeInstanceOf(StudyAccessError);
    expect(verifiedRuntime.complete).not.toHaveBeenCalled();
  });

  it('mantém Free disponível durante o horário comum', async () => {
    vi.setSystemTime(new Date('2026-10-09T10:00:00Z'));
    const verifiedRuntime = runtime(null);
    dependencies.runtime.mockResolvedValue(verifiedRuntime);
    expect(await getStudyAiRuntime(userId)).toBe(verifiedRuntime);
  });

  it('propaga falha na leitura do plano sem autorizar trabalho', async () => {
    const unavailable = new Error('Subscription database unavailable');
    dependencies.runtime.mockRejectedValue(unavailable);
    await expect(getStudyAiRuntime(userId)).rejects.toBe(unavailable);
  });

  it('SSR vincula a disponibilidade de 24h ao usuário verificado e ao fim vigente da assinatura', async () => {
    dependencies.subscription.mockResolvedValue(subscription({ status: 'trialing' }));
    expect(await getUserOperatingHoursInfo(userId)).toMatchObject({
      isOpen: true, unrestrictedAccess: { userId, expiresAt: new Date(expiresAt).toISOString() },
    });
    expect(dependencies.subscription).toHaveBeenCalledExactlyOnceWith(expect.anything(), userId);

    vi.setSystemTime(new Date(expiresAt));
    expect(await getUserOperatingHoursInfo(userId)).toMatchObject({ isOpen: false });
    expect((await getUserOperatingHoursInfo(userId)).unrestrictedAccess).toBeUndefined();
  });

  it('SSR não envia isenção se a assinatura estiver inativa ou a consulta falhar', async () => {
    dependencies.subscription.mockResolvedValue(subscription({ status: 'canceled' }));
    expect(await getUserOperatingHoursInfo(userId)).toEqual(await getOperatingHoursInfo());
    dependencies.subscription.mockRejectedValue(new Error('Subscription unavailable'));
    await expect(getUserOperatingHoursInfo(userId)).rejects.toThrow('Subscription unavailable');
  });
});
