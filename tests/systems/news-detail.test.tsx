import { createElement, type ComponentProps } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const news = vi.hoisted(() => ({ configured: vi.fn(() => true), article: vi.fn(), related: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@/lib/server/noticias', () => ({
  isNewsServerClientConfigured: news.configured,
  fetchNoticiaBySlug: news.article,
  fetchNoticiasPorTag: news.related,
}));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('NEXT_HTTP_ERROR_FALLBACK;404'); } }));
vi.mock('next/link', () => ({ default: (props: ComponentProps<'a'>) => createElement('a', props) }));
vi.mock('next/image', () => ({ default: (props: ComponentProps<'img'>) => createElement('img', props) }));

import NoticiaPage from '../../app/noticias/[slug]/page';

const article = {
  id: 'noticia-principal', titulo: 'Notícia principal preservada', slug: 'principal', resumo: 'Resumo',
  conteudo: '<h2>Educação</h2><p>Texto do artigo principal.</p><script>unsafe()</script>',
  imagem_url: null, fonte_url: null, autor: null, tags: ['Educação'], data_publicacao: '2026-09-30T12:00:00Z',
};

afterEach(() => { vi.clearAllMocks(); news.configured.mockReturnValue(true); });

describe('notícia principal e recuperação do segmento', () => {
  it('preserva o artigo sanitizado quando relacionados falham', async () => {
    news.article.mockResolvedValue(article);
    news.related.mockRejectedValue(new Error('Falha transitória dos relacionados'));
    const markup = renderToStaticMarkup(await NoticiaPage({ params: Promise.resolve({ slug: 'principal' }) }));
    expect(markup).toContain('Notícia principal preservada');
    expect(markup).toContain('Texto do artigo principal.');
    expect(markup).not.toContain('Leituras relacionadas');
    expect(markup).not.toContain('<script>');
    expect(news.related).toHaveBeenCalledWith('Educação', 4);
  });

  it('mantém o 404 de uma notícia inexistente', async () => {
    news.article.mockResolvedValue(null);
    await expect(NoticiaPage({ params: Promise.resolve({ slug: 'inexistente' }) })).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');
    expect(news.related).not.toHaveBeenCalled();
  });

  it('encaminha falhas do serviço para a recuperação de erro, sem simular notícia inexistente', async () => {
    news.configured.mockReturnValue(false);
    await expect(NoticiaPage({ params: Promise.resolve({ slug: 'principal' }) })).rejects.toThrow('temporariamente indisponíveis');
    expect(news.article).not.toHaveBeenCalled();
    news.configured.mockReturnValue(true);
    news.article.mockRejectedValue(new Error('Indisponibilidade do banco'));
    await expect(NoticiaPage({ params: Promise.resolve({ slug: 'principal' }) })).rejects.toThrow('Indisponibilidade do banco');
  });
});
