import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DatabaseError, DB_TIMEOUTS, runQuery } from '../../lib/db/query';
import { SUPABASE_REQUEST_TIMEOUT_MS } from '../../lib/supabase/config';
import { supabaseFetch } from '../../lib/supabase/transport';
import type { Database } from '../../types/supabase';

vi.mock('server-only', () => ({}));
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('transporte cancelável de Supabase', () => {
  it('não inicia rede para um Request previamente cancelado', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    controller.abort();

    await expect(supabaseFetch(new Request('https://database.test/rest/v1/items', {
      signal: controller.signal,
    }))).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
  });

  it('propaga cancelamento do chamador e remove o timer', async () => {
    vi.useFakeTimers();
    let networkSignal: AbortSignal | null | undefined;
    const fetch = vi.fn((_input, init?: RequestInit) => {
      networkSignal = init?.signal;
      return new Promise<Response>(() => {});
    });
    vi.stubGlobal('fetch', fetch);
    const controller = new AbortController();
    const result = supabaseFetch('https://database.test/auth/v1/user', {
      signal: controller.signal,
    }).catch((error: unknown) => error);

    controller.abort(new Error('Caller cancelled'));
    expect(await result).toMatchObject({ name: 'AbortError' });
    expect(networkSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('mantém o prazo enquanto o corpo ainda não terminou de chegar', async () => {
    vi.useFakeTimers();
    let networkSignal: AbortSignal | null | undefined;
    const fetch = vi.fn(async (_input, init?: RequestInit) => {
      networkSignal = init?.signal;
      return new Response(new ReadableStream(), { headers: { 'content-type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetch);
    const result = supabaseFetch('https://database.test/rest/v1/items').catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(SUPABASE_REQUEST_TIMEOUT_MS - 1);
    expect(networkSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toMatchObject({ name: 'AbortError' });
    expect(networkSignal?.aborted).toBe(true);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('preserva status, headers e JSON sem adicionar retries a uma escrita', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => Response.json({ message: 'Unavailable' }, {
      status: 503, headers: { 'retry-after': '60' },
    }));
    vi.stubGlobal('fetch', fetch);
    const response = await supabaseFetch('https://database.test/rest/v1/items', { method: 'POST' });

    expect(response.status).toBe(503);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(await response.json()).toEqual({ message: 'Unavailable' });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('contrato tipado de consultas', () => {
  it('permite ausência nullable e propaga erros de multiplicidade', async () => {
    await expect(runQuery(async () => ({ data: null, error: null }))).resolves.toBeNull();
    await expect(runQuery(async () => ({
      data: null, error: { code: 'PGRST116', message: 'Multiple rows', details: '2 rows' },
    }))).rejects.toMatchObject({ name: 'DatabaseError', code: 'PGRST116', details: '2 rows' });
  });

  it('limita a operação inteira quando o SDK espera Retry-After por mais de oito segundos', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn(async () => Response.json({ message: 'Schema cache unavailable' }, {
      status: 503, headers: { 'retry-after': '60' },
    }));
    vi.stubGlobal('fetch', fetch);
    const client = createClient<Database>('https://database.test', 'test-public-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: supabaseFetch },
    });
    const result = runQuery((signal) => client.from('user_statistics').select('*').abortSignal(signal))
      .catch((error: unknown) => error);

    await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.default);
    expect(await result).toBeInstanceOf(DatabaseError);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });
});
