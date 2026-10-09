import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/supabase';
import { getPublicSupabaseConfig } from './config';
import { supabaseFetch } from './transport';

export function createClient() {
  const { url, key } = getPublicSupabaseConfig();
  // @supabase/ssr reuses the browser client and creates fresh server instances.
  return createBrowserClient<Database>(url, key, {
    global: { fetch: supabaseFetch },
  });
}
