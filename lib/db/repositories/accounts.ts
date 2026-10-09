import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { runQuery } from '@/lib/db/query';
import type { Database } from '@/types/supabase';

type Client = SupabaseClient<Database>;

export async function getAccountRecords(client: Client, userId: string) {
  const [statistics, essays, subscription] = await Promise.all([
    runQuery((signal) => client
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .abortSignal(signal)
      .maybeSingle()),
    runQuery((signal) => client
      .from('essay_results')
      .select('id, nota, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(10)
      .abortSignal(signal)),
    getSubscriptionRecord(client, userId),
  ]);

  return { statistics, essays: essays ?? [], subscription };
}

export function getSubscriptionRecord(client: Client, userId: string) {
  return runQuery((signal) => client
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .abortSignal(signal)
    .maybeSingle());
}

export function recalculateStatistics(client: Client, userId: string) {
  return runQuery((signal) => client
    .rpc('recalculate_user_statistics', { target_user_id: userId })
    .abortSignal(signal));
}
