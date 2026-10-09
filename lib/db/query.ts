import 'server-only';
import { SUPABASE_REQUEST_TIMEOUT_MS } from '@/lib/supabase/config';

export const DB_TIMEOUTS = {
  fast: 4_000,
  default: SUPABASE_REQUEST_TIMEOUT_MS,
  extended: 15_000,
} as const;

export type QueryTimeoutLevel = keyof typeof DB_TIMEOUTS;

export async function withTimeout<T>(
  executor: (signal: AbortSignal) => PromiseLike<T>,
  level: QueryTimeoutLevel = 'default'
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DB_TIMEOUTS[level]);

  try {
    return await executor(controller.signal);
  } finally {
    clearTimeout(timer);
  }
}

type QueryError = {
  code?: string;
  message: string;
  details?: string;
};

/** Runs one typed PostgREST operation with a shared deadline and error contract. */
export async function runQuery<T>(
  executor: (signal: AbortSignal) => PromiseLike<{ data: T; error: QueryError | null }>,
  level: QueryTimeoutLevel = 'default'
): Promise<T> {
  const { data, error } = await withTimeout(executor, level);
  if (error) throw DatabaseError.fromPostgrestError(error);
  return data;
}

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromPostgrestError(error: QueryError) {
    return new DatabaseError(error.message, error.code ?? 'UNKNOWN', error.details);
  }
}
