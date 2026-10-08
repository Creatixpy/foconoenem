import { SUPABASE_REQUEST_TIMEOUT_MS } from './config';

/**
 * Bounds one HTTP exchange, including its JSON response body. Repository
 * deadlines also bound the complete operation, including SDK retry backoff.
 * This transport does not add retries to reads or writes.
 */
export const supabaseFetch: typeof fetch = async (input, init) => {
  const requestSignal = init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const controller = new AbortController();
  const abortError = () => new DOMException('Supabase request aborted or timed out.', 'AbortError');

  if (requestSignal?.aborted) throw abortError();

  const forwardAbort = () => controller.abort(requestSignal?.reason);
  requestSignal?.addEventListener('abort', forwardAbort, { once: true });
  const timer = setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);
  let rejectOnAbort: () => void = () => {};
  const cancelled = new Promise<never>((_resolve, reject) => {
    rejectOnAbort = () => reject(abortError());
    controller.signal.addEventListener('abort', rejectOnAbort, { once: true });
  });

  try {
    const exchange = async () => {
      const response = await globalThis.fetch(input, { ...init, signal: controller.signal });
      // Supabase database/auth APIs return JSON. Consume the response under the
      // same deadline rather than dropping the timer as soon as headers arrive.
      const body = response.body ? await response.arrayBuffer() : null;
      return new Response(body, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    };

    return await Promise.race([exchange(), cancelled]);
  } finally {
    clearTimeout(timer);
    requestSignal?.removeEventListener('abort', forwardAbort);
    controller.signal.removeEventListener('abort', rejectOnAbort);
  }
};
