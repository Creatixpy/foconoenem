import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

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
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    console.warn('Admin client not available: missing SUPABASE_SERVICE_ROLE_KEY');
    return null;
  }

  // We can import createClient from supabase-js directly for admin client
  // as it doesn't need cookie handling usually (unless impersonating)
  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
