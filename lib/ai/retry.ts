import {
  buildGroqProviders,
  GROQ_MAX_ATTEMPTS,
  type GroqProvider,
  isRetryableGroqError,
} from './groq';

export type RetryResult<T> = {
  result: T;
  provider: string;
};

type RetryOptions = {
  maxAttempts?: number;
  providerOffset?: number;
};

/**
 * Execute an async operation with Groq provider retry/fallback.
 * Uses at most GROQ_MAX_ATTEMPTS globally. SDK-level retries are disabled.
 */
export async function withGroqRetry<T>(
  label: string,
  fn: (provider: GroqProvider) => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
  const providers = await buildGroqProviders();
  const attemptsLog: string[] = [];
  const maxAttempts = Math.min(
    GROQ_MAX_ATTEMPTS,
    Math.max(1, options.maxAttempts ?? GROQ_MAX_ATTEMPTS)
  );
  const providerOffset = Math.max(0, options.providerOffset ?? 0);
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const provider = providers[Math.min(providerOffset + attempt, providers.length - 1)];
    try {
      const result = await fn(provider);
      return { result, provider: provider.name };
    } catch (error) {
      lastError = error;
      const detail =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : JSON.stringify(error);
      attemptsLog.push(`(${provider.name}) tentativa ${attempt + 1}: ${detail}`);
      console.error(`[${label}] Erro com ${provider.name} (tentativa ${attempt + 1}):`, error);

      if (!isRetryableGroqError(error) || attempt === maxAttempts - 1) {
        break;
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || `Falha em ${label}`);
  const detailedError = finalError as Error & {
    attemptsLog?: string[];
    retryable?: boolean;
  };
  detailedError.attemptsLog = attemptsLog;
  detailedError.retryable = isRetryableGroqError(lastError);
  finalError.cause = lastError;
  throw finalError;
}
