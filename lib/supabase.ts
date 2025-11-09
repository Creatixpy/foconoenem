'use client';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas.');
}

const DEFAULT_DB_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_SUPABASE_TIMEOUT_MS ?? 4000);

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export async function withSupabaseTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  timeoutMs: number = DEFAULT_DB_TIMEOUT_MS
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await executor(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}
