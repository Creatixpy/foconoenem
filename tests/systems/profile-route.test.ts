import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';

const dependencies = vi.hoisted(() => ({
  auth: vi.fn(),
  admin: vi.fn(),
  getProfile: vi.fn(),
  saveProfile: vi.fn(),
}));

vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/server', () => ({ createAdminClient: dependencies.admin }));
vi.mock('@/lib/server/auth-request', () => ({ resolveRequestUserFromCookies: dependencies.auth }));
vi.mock('@/lib/db/repositories/profiles', () => ({
  getProfile: dependencies.getProfile,
  saveProfile: dependencies.saveProfile,
}));

import { GET, PATCH, POST } from '../../app/api/perfil/route';

const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const otherUserId = '161cfc57-9270-45cc-b527-b15706f890d2';
const client = {};

function request(method: string, body?: string, origin = 'https://site.test') {
  return new NextRequest('https://site.test/api/perfil', {
    method,
    headers: { origin, 'content-type': 'application/json' },
    ...(body === undefined ? {} : { body }),
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  dependencies.auth.mockResolvedValue({ userId });
  dependencies.admin.mockReturnValue(client);
  dependencies.getProfile.mockResolvedValue({ user_id: userId, bio: 'Perfil salvo' });
  dependencies.saveProfile.mockResolvedValue({ user_id: userId, bio: 'Perfil salvo' });
});

afterEach(() => vi.restoreAllMocks());

describe.each([{ method: 'POST', handler: POST }, { method: 'PATCH', handler: PATCH }])(
  '$method /api/perfil',
  ({ method, handler }) => {
    it('rejeita JSON malformado como erro do cliente sem iniciar persistência', async () => {
      const response = await handler(request(method, '{broken'));

      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({ error: 'invalid_json' });
      expect(dependencies.admin).not.toHaveBeenCalled();
      expect(dependencies.saveProfile).not.toHaveBeenCalled();
    });

    it('valida o conteúdo antes de iniciar persistência', async () => {
      const response = await handler(request(method, JSON.stringify({ bio: 'a'.repeat(501) })));

      expect(response.status).toBe(400);
      expect(dependencies.saveProfile).not.toHaveBeenCalled();
      expect(dependencies.admin).not.toHaveBeenCalled();
    });
  },
);

it('recusa origem externa antes de autenticar ou persistir', async () => {
  const response = await PATCH(request('PATCH', '{}', 'https://untrusted.invalid'));

  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({ error: 'forbidden_origin' });
  expect(dependencies.auth).not.toHaveBeenCalled();
  expect(dependencies.saveProfile).not.toHaveBeenCalled();
});

it('exige sessão antes de interpretar o corpo ou acessar o banco', async () => {
  dependencies.auth.mockResolvedValue({ error: NextResponse.json({ error: 'not_authenticated' }, { status: 401 }) });

  const response = await PATCH(request('PATCH', '{broken'));

  expect(response.status).toBe(401);
  expect(dependencies.admin).not.toHaveBeenCalled();
  expect(dependencies.saveProfile).not.toHaveBeenCalled();
});

it('grava somente campos permitidos no usuário autenticado e sanitiza o texto', async () => {
  const response = await PATCH(request('PATCH', JSON.stringify({
    user_id: otherUserId,
    bio: '  Estudo <ENEM>  ',
    objetivo: '',
    ano_enem: 2027,
    plan_code: 'max',
    total_acertos: 999,
  })));

  expect(response.status).toBe(200);
  expect(dependencies.saveProfile).toHaveBeenCalledExactlyOnceWith(client, userId, {
    bio: 'Estudo ENEM',
    objetivo: null,
    ano_enem: 2027,
  });
});

it('mantém falhas internas como 500, sem expor detalhes do banco', async () => {
  dependencies.saveProfile.mockRejectedValue(new SyntaxError('private database detail'));

  const response = await PATCH(request('PATCH', '{}'));

  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({
    error: 'Internal Server Error',
    code: 'INTERNAL_ERROR',
    requestId: expect.any(String),
  });
});

it('carrega o perfil do usuário autenticado sem cache compartilhado', async () => {
  const response = await GET(request('GET'));

  expect(response.status).toBe(200);
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(dependencies.getProfile).toHaveBeenCalledExactlyOnceWith(client, userId);
});
