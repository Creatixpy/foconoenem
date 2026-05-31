import { buildGroqProviders, GROQ_MAX_ATTEMPTS, type GroqProvider, isRateLimitError } from './groq';

export type RetryResult<T> = {
  result: T;
  provider: string;
};

/**
 * Execute an async operation with Groq provider retry/fallback.
 * Tries each provider up to GROQ_MAX_ATTEMPTS times, switching to
 * the next provider on rate-limit errors.
 */
export async function withGroqRetry<T>(
  label: string,
  fn: (provider: GroqProvider) => Promise<T>,
): Promise<RetryResult<T>> {
  const providers = await buildGroqProviders();
  const attemptsLog: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const result = await fn(provider);
        return { result, provider: provider.name };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
        attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
        console.error(`[${label}] Erro com ${provider.name} (tentativa ${attempt}):`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || `Falha em ${label}`);
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
}
