import 'server-only';

import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { supabaseFetch } from '@/lib/supabase/transport';

let adminClient: { url: string; key: string; client: SupabaseClient<Database> } | undefined;

/**
 * Creates a server-side Supabase client
 * Uses anon key with RLS enabled and cookie handling
 */
export function createServerClient(): Promise<SupabaseClient<Database>> {
  return createSupabaseServerClient();
}

/**
 * Creates an admin Supabase client
 * Uses service role key - bypasses RLS (use with caution)
 */
export function createAdminClient(): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    adminClient = undefined;
    return null;
  }

  if (adminClient?.url === url && adminClient.key === serviceKey) return adminClient.client;

  const client = createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: { fetch: supabaseFetch },
  });
  adminClient = { url, key: serviceKey, client };
  return client;
}
