import { createClient } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Database } from '../../types/supabase';

const clients = vi.hoisted(() => ({ createAdminClient: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/server', () => clients);
vi.mock('@/lib/server/local-maintenance', () => ({ cleanupRateLimitsIfDue: vi.fn(async () => ({ ran: false, deleted: 0 })) }));

import { checkRateLimit } from '../../lib/server/rate-limit';
import { DB_TIMEOUTS } from '../../lib/db/query';

function configure(fetcher: typeof fetch) {
  clients.createAdminClient.mockReturnValue(createClient<Database>('https://database.test', 'local-test-key', {
    auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: fetcher },
  }));
}

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); vi.clearAllMocks(); });

describe('rate limiting durante indisponibilidade do banco', () => {
  it('nega acesso sem configuração administrativa', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    clients.createAdminClient.mockReturnValue(null);
    await expect(checkRateLimit('user', '/api/ocr', 10, 60)).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });

  it('preserva a decisão transacional e o próximo reset', async () => {
    configure(async () => Response.json([{ allowed: true, remaining: 9, reset_at: '2026-10-08T15:00:00Z' }]));
    await expect(checkRateLimit('user', '/api/ocr', 10, 60)).resolves.toEqual({
      allowed: true, remaining: 9, resetAt: new Date('2026-10-08T15:00:00Z'),
    });
  });

  it('nega acesso quando a RPC falha', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    configure(async () => Response.json({ code: '42501', message: 'Permission denied' }, { status: 403 }));
    await expect(checkRateLimit('user', '/api/ocr', 10, 60)).resolves.toMatchObject({ allowed: false, remaining: 0 });
  });

  it('cancela a RPC lenta em quatro segundos e continua negando acesso', async () => {
    vi.useFakeTimers();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let signal: AbortSignal | null | undefined;
    configure((_, init) => {
      signal = init?.signal;
      return new Promise((_, reject) => signal?.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true }));
    });

    const request = checkRateLimit('user', '/api/ocr', 10, 60);
    await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.fast);
    await expect(request).resolves.toMatchObject({ allowed: false, remaining: 0 });
    expect(signal?.aborted).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});
