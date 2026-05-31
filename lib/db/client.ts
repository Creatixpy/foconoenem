/**
 * Supabase Database Client (Browser/Client-side)
 * This file contains client-side specific logic and types.
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client';

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
// Client Accessors
// ============================================================================

/**
 * Gets the browser Supabase client (singleton pattern handled internally)
 * Uses anon key for client-side operations with RLS
 */
export function getBrowserClient(): SupabaseClient<Database> {
  return createBrowserSupabaseClient();
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
