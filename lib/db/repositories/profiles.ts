import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { runQuery } from '@/lib/db/query';
import type { Database } from '@/types/supabase';

type Client = SupabaseClient<Database>;
export type ProfileChanges = Pick<
  Database['public']['Tables']['user_profiles']['Insert'],
  'nome_completo' | 'bio' | 'objetivo' | 'ano_enem'
>;

export function getProfile(client: Client, userId: string) {
  return runQuery((signal) => client
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .abortSignal(signal)
    .maybeSingle());
}

export async function saveProfile(client: Client, userId: string, changes: ProfileChanges) {
  const profile = await runQuery((signal) => client
    .from('user_profiles')
    .upsert({ ...changes, user_id: userId }, { onConflict: 'user_id' })
    .select('*')
    .abortSignal(signal)
    .single());

  // A profile retry must not replace accumulated statistics.
  await runQuery((signal) => client
    .from('user_statistics')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true })
    .abortSignal(signal));

  return profile;
}
