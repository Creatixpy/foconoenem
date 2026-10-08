import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const dependencies = vi.hoisted(() => ({ user: vi.fn(), subscription: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/server', () => ({
  createServerClient: async () => ({ auth: { getUser: dependencies.user } }),
  createAdminClient: () => ({}),
}));
vi.mock('@/lib/server/request-origin', () => ({ ensureTrustedOrigin: () => null }));
vi.mock('@/lib/server/subscriptions', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../lib/server/subscriptions')>(),
  getUserSubscription: dependencies.subscription,
}));

import { GET } from '../../app/api/assinatura/status/route';

const request = () => new NextRequest('https://site.test/api/assinatura/status');
afterEach(() => vi.resetAllMocks());

describe('status de assinatura distingue falha temporária e sessão ausente', () => {
  it('retorna 503 na falha temporária de Auth em vez de remover o acesso Max no navegador', async () => {
    dependencies.user.mockResolvedValue({ data: { user: null }, error: new AuthRetryableFetchError('Auth unavailable', 503) });
    const response = await GET(request());
    expect(response.status).toBe(503);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).not.toHaveProperty('authenticated');
    expect(dependencies.subscription).not.toHaveBeenCalled();
  });

  it.each([new AuthSessionMissingError(), new AuthApiError('Invalid JWT', 401, 'bad_jwt'), new AuthApiError('Invalid user', 403, 'user_banned')])('preserva o contrato anônimo para $name/$status', async (error) => {
    dependencies.user.mockResolvedValue({ data: { user: null }, error });
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ authenticated: false, userId: null, subscription: { hasMaxAccess: false } });
    expect(dependencies.subscription).not.toHaveBeenCalled();
  });

  it('vincula o status ao ID verificado em Auth', async () => {
    const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
    dependencies.user.mockResolvedValue({ data: { user: { id: userId } }, error: null });
    dependencies.subscription.mockResolvedValue(null);
    const response = await GET(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ authenticated: true, userId, subscription: { hasMaxAccess: false } });
    expect(dependencies.subscription).toHaveBeenCalledExactlyOnceWith(expect.anything(), userId);
  });
});
