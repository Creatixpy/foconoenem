import 'server-only';

export const DB_TIMEOUTS = {
  fast: 4_000,
  default: 8_000,
  extended: 15_000,
} as const;

export type QueryTimeoutLevel = keyof typeof DB_TIMEOUTS;

export async function withTimeout<T>(
  executor: (signal: AbortSignal) => Promise<T>,
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

export class DatabaseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'DatabaseError';
  }

  static fromPostgrestError(error: {
    code?: string;
    message: string;
    details?: string;
  }) {
    return new DatabaseError(error.message, error.code ?? 'UNKNOWN', error.details);
  }
}

export function isNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: string }).code === 'PGRST116'
  );
}
