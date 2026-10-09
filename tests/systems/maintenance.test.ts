import { createClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../types/supabase';

const clients = vi.hoisted(() => ({ createAdminClient: vi.fn(), createServerClient: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/server', () => clients);

import { DB_TIMEOUTS } from '../../lib/db/query';
import { cleanupCachedThemesIfDue } from '../../lib/server/local-maintenance';
import { trackEvent } from '../../lib/server/analytics';

function configureClient(fetcher: typeof fetch) {
  clients.createAdminClient.mockReturnValue(createClient<Database>(
    'https://database.test',
    'local-test-key',
    { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher } },
  ));
}

function pendingUntilAbort(signal: AbortSignal | null | undefined): Promise<Response> {
  if (!signal) throw new Error('Expected a cancellable database request.');
  return new Promise((_, reject) => {
    const abort = () => reject(new DOMException('Local timeout', 'AbortError'));
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('manutenção e analytics com tempo de execução limitado', () => {
  it('mantém o resultado da RPC e audita somente uma manutenção executada', async () => {
    let ran = false;
    const fetcher = vi.fn<typeof fetch>(async (input) => (
      String(input).includes('/rpc/')
        ? Response.json({ ran, deleted: ran ? 3 : 0, ran_at: '2026-10-08T12:00:00Z' })
        : new Response(null, { status: 201 })
    ));
    configureClient(fetcher);

    expect(await cleanupCachedThemesIfDue()).toEqual({ deleted: 0, ran: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
    ran = true;
    expect(await cleanupCachedThemesIfDue()).toEqual({ deleted: 3, ran: true });
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(JSON.parse(String(fetcher.mock.calls[2][1]?.body))).toMatchObject({
      action: 'maintenance_run', details: { task: 'cached_themes', deleted: 3 },
    });
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancela uma RPC de manutenção pendente sem bloquear o chamador', async () => {
    const signals: AbortSignal[] = [];
    configureClient(vi.fn<typeof fetch>((_, init) => {
      if (init?.signal) signals.push(init.signal);
      return pendingUntilAbort(init?.signal);
    }));

    const result = cleanupCachedThemesIfDue();
    await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.default - 1);
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await result).toEqual({ deleted: 0, ran: false });
    expect(signals[0].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('inclui a auditoria no mesmo prazo sem perder uma manutenção concluída', async () => {
    const signals: AbortSignal[] = [];
    configureClient(vi.fn<typeof fetch>(async (input, init) => {
      if (init?.signal) signals.push(init.signal);
      if (String(input).includes('/rpc/')) {
        await new Promise((resolve) => setTimeout(resolve, 1_000));
        return Response.json({ ran: true, deleted: 3, ran_at: '2026-10-08T12:00:00Z' });
      }
      return pendingUntilAbort(init?.signal);
    }));

    const result = cleanupCachedThemesIfDue();
    await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.default);
    expect(await result).toEqual({ deleted: 3, ran: true });
    expect(signals).toHaveLength(2);
    expect(signals[0]).toBe(signals[1]);
    expect(signals[1].aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('cancela analytics pendente e preserva seu comportamento opcional', async () => {
    let analyticsSignal: AbortSignal | null | undefined;
    configureClient(vi.fn<typeof fetch>(async (input, init) => {
      if (String(input).includes('/rpc/')) return Response.json({ ran: false, deleted: 0 });
      analyticsSignal = init?.signal;
      return pendingUntilAbort(analyticsSignal);
    }));

    const event = trackEvent({ eventType: 'essay_submitted', metadata: { submission_id: 'local-test' } });
    await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.fast);
    await expect(event).resolves.toBeUndefined();
    expect(analyticsSignal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
