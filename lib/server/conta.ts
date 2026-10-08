import 'server-only';

import { toSubscriptionSummary } from '@/lib/server/subscriptions';
import { createAdminClient } from '@/lib/db/server';
import { getAccountRecords, recalculateStatistics } from '@/lib/db/repositories/accounts';

function parseNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Fetches user statistics and essays
 */
export async function fetchContaData(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin não configurado');
  }

  const records = await getAccountRecords(supabase, userId);
  const statistics = records.statistics ? { ...records.statistics } : null;
  if (statistics) {
    const numericFields = [
      'media_nota_redacao',
      'media_competencia1',
      'media_competencia2',
      'media_competencia3',
      'media_competencia4',
      'media_competencia5',
      'taxa_acerto',
    ] as const;

    for (const field of numericFields) {
      (statistics as Record<string, unknown>)[field] = parseNullableNumber(statistics[field]);
    }
  }

  return {
    statistics,
    essays: records.essays,
    subscription: toSubscriptionSummary(records.subscription),
  };
}

/**
 * Recalculates user statistics
 */
export async function recalculateContaStatistics(userId: string) {
  const supabase = createAdminClient();
  if (!supabase) {
    throw new Error('Supabase admin não configurado');
  }

  return recalculateStatistics(supabase, userId);
}
