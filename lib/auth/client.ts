'use client';

/**
 * Supabase Client for Authentication
 * Centralized client configuration for auth operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let supabaseInstance: SupabaseClient<Database> | null = null;

/**
 * Gets or creates the Supabase client instance
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // More secure than implicit flow
    },
  });

  return supabaseInstance;
}

/**
 * Default timeout for database operations
 */
const DEFAULT_TIMEOUT_MS = 8000;

/**
 * Executes a Supabase operation with timeout
 */
export async function withTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await executor(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// Export singleton instance
export const supabase = getSupabaseClient();
