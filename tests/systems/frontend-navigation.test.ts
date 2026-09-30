import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { accountTabFromQuery, accountTabHref, isWorkspacePath, isLegacySessionPath } from '../../lib/client/workspace-navigation';
import { createLegacyHostNotice, createRebrandingNotice, REBRANDING_EXPIRES_AT } from '../../lib/client/rebranding-notice';
import { createPageMetadata } from '../../lib/contracts/page-metadata';
import { getLegacyPublicRedirect } from '../../lib/contracts/site-routing';

vi.mock('../../lib/supabase/middleware', () => ({ updateSession: vi.fn(async () => new Response()) }));
import { updateSession } from '../../lib/supabase/middleware';
import { proxy } from '../../proxy';

function memoryStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}

describe('navegação de trabalho e avisos', () => {
  it('histórico sincroniza com URL preservando retorno de assinatura', () => {
    expect(accountTabFromQuery('redacoes')).toBe('essays');
    expect(accountTabFromQuery('incorreto')).toBe('overview');
    expect(accountTabHref('subscription=success&q=a', 'essays')).toBe('/conta?subscription=success&q=a&aba=redacoes');
    expect(accountTabHref('subscription=success&aba=redacoes', 'overview')).toBe('/conta?subscription=success');
  });
  it('rodapé compacto somente em áreas de trabalho', () => {
    for (const path of ['/redacao', '/conta/editar', '/questoes', '/resultados/id', '/noticias/admin']) expect(isWorkspacePath(path)).toBe(true);
    for (const path of ['/', '/sobre', '/noticias', '/noticias/artigo', '/noticias/pesquisa', '/contabilidade']) expect(isWorkspacePath(path)).toBe(false);
    for (const path of ['/login', '/reset-password', '/planos', '/doacao/sucesso']) expect(isLegacySessionPath(path)).toBe(true);
  });
  it('preserva dispensa e expira rebrand sem expirar acesso aos rascunhos legados', () => {
    const storage = memoryStorage();
    const notice = createRebrandingNotice(() => storage);
    expect(notice.isVisible(REBRANDING_EXPIRES_AT - 1)).toBe(true);
    expect(notice.isVisible(REBRANDING_EXPIRES_AT)).toBe(false);
    notice.dismiss();
    expect(createRebrandingNotice(() => storage).isVisible(REBRANDING_EXPIRES_AT - 1)).toBe(false);
    expect(createLegacyHostNotice(() => memoryStorage()).isVisible(REBRANDING_EXPIRES_AT + 1)).toBe(true);
  });
  it('armazenamento negado não impede dispensa nesta página', () => {
    const notice = createRebrandingNotice(() => { throw new Error('Storage denied'); });
    expect(notice.isVisible(REBRANDING_EXPIRES_AT - 1)).toBe(true);
    expect(() => notice.dismiss()).not.toThrow();
    expect(notice.isVisible(REBRANDING_EXPIRES_AT - 1)).toBe(false);
  });
});

describe('canonical e transição gradual', () => {
  it('metadados usam título único e canonical da página, com áreas privadas noindex', () => {
    const metadata = createPageMetadata({ title: 'Redação', description: 'Pratique', pathname: '/redacao', noIndex: true });
    expect(metadata.title).toEqual({ absolute: 'Redação | AprovIA' });
    expect(metadata.alternates?.canonical).toBe('https://aproviaedu.vercel.app/redacao');
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(createPageMetadata({ title: 'Autenticação', description: '' }).title).toEqual({ absolute: 'Autenticação | AprovIA' });
  });
  it.each(['/', '/sobre', '/privacidade', '/termos', '/noticias', '/noticias/pesquisa', '/noticias/meu-artigo'])('redireciona %s preservando a pesquisa', (path) => {
    for (const method of ['GET', 'HEAD']) expect(getLegacyPublicRedirect(new URL(`https://foconoenem.vercel.app${path}?q=educação&modo=ia`), method)?.href).toBe(`https://aproviaedu.vercel.app${path}?q=educa%C3%A7%C3%A3o&modo=ia`);
  });
  it('não altera origens de sessão, estudo, pagamentos, APIs ou métodos de escrita', () => {
    for (const path of ['/login', '/auth/callback', '/reset-password', '/redacao', '/conta', '/planos', '/doacao', '/noticias/admin', '/noticias/%61dmin', '/api/corrigir']) expect(getLegacyPublicRedirect(new URL(`https://foconoenem.vercel.app${path}`), 'GET')).toBeNull();
    expect(getLegacyPublicRedirect(new URL('https://foconoenem.vercel.app/'), 'POST')).toBeNull();
    expect(getLegacyPublicRedirect(new URL('https://aproviaedu.vercel.app/'), 'GET')).toBeNull();
    expect(getLegacyPublicRedirect(new URL('https://foconoenem.vercel.app/'), 'GET', false)).toBeNull();
  });
  it('proxy entrega 301 sem bootstrap extra para conteúdo público', async () => {
    vi.mocked(updateSession).mockClear();
    const response = await proxy(new NextRequest('https://foconoenem.vercel.app/sobre?origem=home'));
    expect(response.status).toBe(301);
    expect(response.headers.get('location')).toBe('https://aproviaedu.vercel.app/sobre?origem=home');
    const localResponse = await proxy(new NextRequest('http://localhost:4174/sobre?q=educacao', { headers: { host: 'foconoenem.vercel.app' } }));
    expect(localResponse.status).toBe(301);
    expect(localResponse.headers.get('location')).toBe('https://aproviaedu.vercel.app/sobre?q=educacao');
    const canonicalResponse = await proxy(new NextRequest('http://localhost:4174/sobre', { headers: { host: 'aproviaedu.vercel.app', 'x-forwarded-host': 'foconoenem.vercel.app' } }));
    expect(canonicalResponse.status).toBe(200);
    await proxy(new NextRequest('https://aproviaedu.vercel.app/sobre'));
    expect(updateSession).not.toHaveBeenCalled();
    await proxy(new NextRequest('https://foconoenem.vercel.app/redacao'));
    expect(updateSession).toHaveBeenCalledOnce();
  });
});
