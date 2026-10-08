import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

const sdk = vi.hoisted(() => ({ createClient: vi.fn(), createServerClient: vi.fn(), cookies: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@supabase/supabase-js', () => ({ createClient: sdk.createClient }));
vi.mock('@supabase/ssr', () => ({ createServerClient: sdk.createServerClient }));
vi.mock('next/headers', () => ({ cookies: sdk.cookies }));

import { createAdminClient, createServerClient } from '../../lib/db/server';
import { updateSession } from '../../lib/supabase/middleware';
import { NextRequest } from 'next/server';

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://database.test');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'test-public-key');
  vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-key');
  sdk.createClient.mockImplementation(() => ({} as SupabaseClient<Database>));
});
afterEach(() => { vi.unstubAllEnvs(); vi.resetAllMocks(); });

describe('ciclo de vida de clientes', () => {
  it('reutiliza apenas o admin sem sessão e invalida o cliente quando a configuração muda', () => {
    const first = createAdminClient();
    expect(createAdminClient()).toBe(first);
    expect(sdk.createClient).toHaveBeenCalledTimes(1);
    expect(sdk.createClient).toHaveBeenCalledWith('https://database.test', 'test-service-key', {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { fetch: expect.any(Function) },
    });

    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'rotated-test-service-key');
    expect(createAdminClient()).not.toBe(first);
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', '');
    expect(createAdminClient()).toBeNull();
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'rotated-test-service-key');
    createAdminClient();
    expect(sdk.createClient).toHaveBeenCalledTimes(3);
  });

  it('mantém cookies e clientes SSR isolados entre requisições', async () => {
    const cookieStores = [
      { getAll: () => [{ name: 'session', value: 'user-a' }], set: vi.fn() },
      { getAll: () => [{ name: 'session', value: 'user-b' }], set: vi.fn() },
    ];
    sdk.cookies.mockResolvedValueOnce(cookieStores[0]).mockResolvedValueOnce(cookieStores[1]);
    sdk.createServerClient.mockImplementation((_url, _key, options) => ({ cookies: options.cookies }));

    const first = await createServerClient();
    const second = await createServerClient();
    expect(first).not.toBe(second);
    const [firstOptions, secondOptions] = sdk.createServerClient.mock.calls.map((call) => call[2]);
    expect(firstOptions.cookies.getAll()).toEqual([{ name: 'session', value: 'user-a' }]);
    expect(secondOptions.cookies.getAll()).toEqual([{ name: 'session', value: 'user-b' }]);
  });

  it('encaminha cookies renovados para a mesma requisição e preserva headers de proteção e cache', async () => {
    sdk.createServerClient.mockImplementation((_url, _key, options) => ({
      auth: { getUser: async () => {
        options.cookies.setAll([{ name: 'session', value: 'refreshed', options: { httpOnly: true } }], {
          'cache-control': 'private, no-store', vary: 'Cookie',
        });
        return { data: { user: null }, error: null };
      } },
    }));
    const request = new NextRequest('https://site.test/conta', { headers: { cookie: 'session=expired' } });
    const response = await updateSession(request);

    expect(request.cookies.get('session')?.value).toBe('refreshed');
    expect(response.cookies.get('session')?.value).toBe('refreshed');
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('vary')).toBe('Cookie');
    expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
  });
});
