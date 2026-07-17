'use server';

import { toSubscriptionSummary } from '@/lib/server/subscriptions';
import { createAdminClient } from '@/lib/db/server';

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

  const [statsResponse, essaysResponse, subscriptionResponse] = await Promise.all([
    supabase.from('user_statistics').select('*').eq('user_id', userId).single(),
    supabase
      .from('essay_results')
      .select('id, nota, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle(),
  ]);

  if (statsResponse.error) throw statsResponse.error;
  if (essaysResponse.error) throw essaysResponse.error;
  if (subscriptionResponse.error) throw subscriptionResponse.error;

  const statistics = statsResponse.data ? { ...statsResponse.data } : null;
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
    essays: essaysResponse.data ?? [],
    subscription: toSubscriptionSummary(subscriptionResponse.data ?? null),
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

  const { data, error } = await supabase.rpc('recalculate_user_statistics', {
    target_user_id: userId,
  });

  if (error) throw error;
  return data;
}
