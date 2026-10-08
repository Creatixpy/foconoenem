import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { Database } from '../../types/supabase';

vi.mock('server-only', () => ({}));

import { getAccountRecords } from '../../lib/db/repositories/accounts';
import { getProfile, saveProfile } from '../../lib/db/repositories/profiles';
import { getApprovedNewsBySlug, listApprovedNews } from '../../lib/db/repositories/news';

const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';

function clientWith(fetcher: typeof fetch) {
  return createClient<Database>('https://database.test', 'local-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetcher },
  });
}

describe('repositórios de conta, perfil e notícias', () => {
  it('retorna uma conta sem estatísticas ou assinatura e mantém filtros de dono', async () => {
    const urls: URL[] = [];
    const client = clientWith(async (input) => {
      urls.push(new URL(String(input)));
      return Response.json([]);
    });

    await expect(getAccountRecords(client, userId)).resolves.toEqual({ statistics: null, essays: [], subscription: null });
    expect(urls).toHaveLength(3);
    expect(urls.every((url) => url.searchParams.get('user_id') === `eq.${userId}`)).toBe(true);
    const history = urls.find((url) => url.pathname.endsWith('/essay_results'));
    expect(history?.searchParams.get('limit')).toBe('10');
    expect(history?.searchParams.get('order')).toBe('created_at.desc,id.desc');
  });

  it('não apresenta falha de consulta de conta como um histórico vazio', async () => {
    const client = clientWith(async (input) => String(input).includes('/essay_results')
      ? Response.json({ code: '42501', message: 'Permission denied' }, { status: 403 })
      : Response.json([]));

    await expect(getAccountRecords(client, userId)).rejects.toMatchObject({ name: 'DatabaseError', code: '42501' });
  });

  it('perfil inexistente é null e o erro de leitura continua sendo um erro', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json({ code: '42501', message: 'Permission denied' }, { status: 403 }));
    const client = clientWith(fetcher);

    await expect(getProfile(client, userId)).resolves.toBeNull();
    await expect(getProfile(client, userId)).rejects.toMatchObject({ code: '42501' });
  });

  it('salva mudanças de perfil sem sobrescrever estatísticas existentes', async () => {
    const writes: Array<{ url: URL; payload: unknown; preference: string | null }> = [];
    const profile = { user_id: userId, bio: 'Preparação para o ENEM' };
    const client = clientWith(async (input, init) => {
      writes.push({ url: new URL(String(input)), payload: JSON.parse(String(init?.body)), preference: new Headers(init?.headers).get('Prefer') });
      return String(input).includes('/user_profiles')
        ? Response.json(profile)
        : new Response(null, { status: 201 });
    });

    await expect(saveProfile(client, userId, { bio: profile.bio })).resolves.toEqual(profile);
    expect(writes[0].payload).toEqual(profile);
    expect(writes[1].payload).toEqual({ user_id: userId });
    expect(writes[1].preference).toContain('resolution=ignore-duplicates');
    expect(writes.every((write) => write.url.searchParams.get('on_conflict') === 'user_id')).toBe(true);
  });

  it('não informa sucesso quando a criação das estatísticas falha', async () => {
    const client = clientWith(async (input) => String(input).includes('/user_profiles')
      ? Response.json({ user_id: userId })
      : Response.json({ code: '23503', message: 'Foreign key violation' }, { status: 409 }));

    await expect(saveProfile(client, userId, {})).rejects.toMatchObject({ code: '23503' });
  });

  it('notícia inexistente mantém null, mas falhas e resultados ambíguos não viram 404', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: 'a' }, { id: 'b' }]));
    const client = clientWith(fetcher);

    await expect(getApprovedNewsBySlug(client, 'missing')).resolves.toBeNull();
    await expect(getApprovedNewsBySlug(client, 'duplicate')).rejects.toMatchObject({ code: 'PGRST116' });
    const query = new URL(String(fetcher.mock.calls[0][0]));
    expect(query.searchParams.get('status')).toBe('eq.aprovado');
    expect(query.searchParams.get('slug')).toBe('eq.missing');
  });

  it('usa notícias aprovadas como fallback somente se destaques estiverem vazios', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValueOnce(Response.json([]))
      .mockResolvedValueOnce(Response.json([{ id: 'article' }]));
    const client = clientWith(fetcher);

    await expect(listApprovedNews(client, { limit: 2, offset: 3, destaque: true, tag: 'Educação' }))
      .resolves.toEqual([{ id: 'article' }]);
    const urls = fetcher.mock.calls.map(([input]) => new URL(String(input)));
    expect(urls[0].searchParams.get('destaque')).toBe('eq.true');
    expect(urls[1].searchParams.has('destaque')).toBe(false);
    for (const url of urls) {
      expect(url.searchParams.get('status')).toBe('eq.aprovado');
      expect(url.searchParams.get('tags')).toContain('Educação');
      expect(url.searchParams.get('offset')).toBe('3');
      expect(url.searchParams.get('limit')).toBe('2');
      expect(url.searchParams.get('order')).toBe('data_publicacao.desc,id.desc');
    }
  });

  it('falha nos destaques não inicia outra leitura nem devolve lista vazia', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json({ code: '42501', message: 'Permission denied' }, { status: 403 }));
    await expect(listApprovedNews(clientWith(fetcher), { limit: 2, offset: 0, destaque: true }))
      .rejects.toMatchObject({ code: '42501' });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
