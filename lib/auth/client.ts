'use client';

/**
 * Supabase Client for Authentication
 * Re-exports the browser client from the db module for auth operations
 */

import { getBrowserClient } from '@/lib/db';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Gets the Supabase client instance for auth operations
 */
export function getSupabaseClient(): SupabaseClient<Database> {
  return getBrowserClient();
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

// Lazy singleton - only initializes when first accessed (avoids build-time errors)
let _supabaseInstance: SupabaseClient<Database> | null = null;

export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, prop) {
    if (!_supabaseInstance) {
      _supabaseInstance = getBrowserClient();
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (_supabaseInstance as any)[prop];
    return typeof value === 'function' ? value.bind(_supabaseInstance) : value;
  },
});
