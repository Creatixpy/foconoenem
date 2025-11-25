/**
 * Supabase Database Client
 * Centralized client management for all database operations
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

// ============================================================================
// Configuration
// ============================================================================

const CONFIG = {
  /** Default timeout for database operations in milliseconds */
  DEFAULT_TIMEOUT_MS: 8000,
  /** Fast timeout for simple queries */
  FAST_TIMEOUT_MS: 4000,
  /** Extended timeout for complex operations */
  EXTENDED_TIMEOUT_MS: 15000,
} as const;

// ============================================================================
// Environment validation
// ============================================================================

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      'Environment variable NEXT_PUBLIC_SUPABASE_URL is not configured. ' +
      'Please add it to your Vercel environment variables or .env.local file.'
    );
  }
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      'Environment variable NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured. ' +
      'Please add it to your Vercel environment variables or .env.local file.'
    );
  }
  return key;
}

// ============================================================================
// Client Singleton (Browser/Client-side)
// ============================================================================

let browserClient: SupabaseClient<Database> | null = null;

/**
 * Gets the browser Supabase client (singleton pattern)
 * Uses anon key for client-side operations with RLS
 */
export function getBrowserClient(): SupabaseClient<Database> {
  if (browserClient) return browserClient;

  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  browserClient = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
  });

  return browserClient;
}

// ============================================================================
// Server Client Factory
// ============================================================================

/**
 * Creates a server-side Supabase client
 * Uses anon key with RLS enabled
 */
export function createServerClient(): SupabaseClient<Database> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
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

  return createClient<Database>(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================================================
// Query Execution Utilities
// ============================================================================

export type QueryTimeoutLevel = 'fast' | 'default' | 'extended';

function getTimeoutMs(level: QueryTimeoutLevel): number {
  switch (level) {
    case 'fast': return CONFIG.FAST_TIMEOUT_MS;
    case 'extended': return CONFIG.EXTENDED_TIMEOUT_MS;
    default: return CONFIG.DEFAULT_TIMEOUT_MS;
  }
}

/**
 * Executes a database operation with timeout and abort signal
 */
export async function withTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
  level: QueryTimeoutLevel = 'default'
): Promise<T> {
  const controller = new AbortController();
  const timeoutMs = getTimeoutMs(level);
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await executor(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================================
// Error Handling
// ============================================================================

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromPostgrestError(error: { code?: string; message: string; details?: string }): DatabaseError {
    return new DatabaseError(
      error.message,
      error.code ?? 'UNKNOWN',
      error.details
    );
  }

  static notFound(entity: string): DatabaseError {
    return new DatabaseError(`${entity} not found`, 'NOT_FOUND');
  }

  static unauthorized(): DatabaseError {
    return new DatabaseError('Unauthorized access', 'UNAUTHORIZED');
  }

  static timeout(): DatabaseError {
    return new DatabaseError('Database operation timed out', 'TIMEOUT');
  }
}

/**
 * Type guard to check if error is a Postgres "not found" error
 */
export function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { code?: string };
  return err.code === 'PGRST116';
}

// ============================================================================
// Re-exports
// ============================================================================

export type { SupabaseClient, Database };
export { CONFIG as DB_CONFIG };
