'use client';

import { useState, useEffect, useCallback } from 'react';
import { ApiError, apiError, failureMessage } from '@/lib/client/api-errors';
import { createLatestRequest, deduplicateById } from '@/lib/client/latest-request';

export interface NoticiaAPI {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  autor: string | null;
  data_publicacao: string;
  tags: string[];
  destaque: boolean;
  created_at: string;
  fonte_url: string | null;
}
const EMPTY_NEWS: NoticiaAPI[] = [];

async function readNews(response: Response): Promise<NoticiaAPI[]> {
  const data = await response.json().catch(() => null);
  if (!response.ok) throw apiError(response, data, 'Não foi possível carregar as notícias. Tente novamente.');
  if (!data || !Array.isArray(data.noticias)) throw new ApiError('Não conseguimos abrir as notícias. Tente novamente.', 'unavailable');
  return data.noticias;
}

export function useNoticias(pageSize = 9, initialNoticias: NoticiaAPI[] = EMPTY_NEWS) {
  const [requests] = useState(createLatestRequest);
  const [noticias, setNoticias] = useState(() => deduplicateById(initialNoticias));
  const [loading, setLoading] = useState(initialNoticias.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moreError, setMoreError] = useState<string | null>(null);
  const [offset, setOffset] = useState(initialNoticias.length);
  const [hasMore, setHasMore] = useState(initialNoticias.length >= pageSize);

  const fetchPage = useCallback(async (currentOffset: number, append: boolean) => {
    const request = requests.begin();
    setLoadingMore(append);
    setLoading(!append);
    setError(null);
    setMoreError(null);
    try {
      const params = new URLSearchParams({ limit: String(pageSize), offset: String(currentOffset) });
      const items = await readNews(await fetch(`/api/noticias?${params}`, { signal: request.signal }));
      if (!request.isCurrent()) return;
      setNoticias((previous) => deduplicateById(append ? [...previous, ...items] : items));
      setHasMore(items.length >= pageSize);
      // Advance by the raw page length, not the deduplicated length. Failure keeps this offset.
      setOffset(currentOffset + items.length);
    } catch (failure) {
      if (!request.isCurrent()) return;
      const message = failureMessage(failure);
      if (append) setMoreError(message);
      else setError(message);
    } finally {
      if (request.isCurrent()) { setLoading(false); setLoadingMore(false); request.finish(); }
    }
  }, [pageSize, requests]);
  useEffect(() => {
    if (initialNoticias.length === 0) void fetchPage(0, false);
    return () => requests.cancel();
  }, [fetchPage, initialNoticias.length, requests]);
  const loadMore = useCallback(() => {
    if (!requests.isPending() && hasMore) void fetchPage(offset, true);
  }, [offset, hasMore, fetchPage, requests]);
  const refetch = useCallback(() => { void fetchPage(0, false); }, [fetchPage]);
  return { noticias, loading, loadingMore, error, moreError, hasMore, loadMore, refetch };
}

export function useDestaques(limit = 3, initialDestaques: NoticiaAPI[] = EMPTY_NEWS) {
  const [requests] = useState(createLatestRequest);
  const [destaques, setDestaques] = useState(initialDestaques);
  const [loading, setLoading] = useState(initialDestaques.length === 0);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    const request = requests.begin();
    setError(null);
    try {
      const items = await readNews(await fetch(`/api/noticias?destaque=true&limit=${limit}&offset=0`, { signal: request.signal }));
      if (request.isCurrent()) setDestaques(deduplicateById(items));
    } catch (failure) {
      if (request.isCurrent()) setError(failureMessage(failure));
    } finally {
      if (request.isCurrent()) { setLoading(false); request.finish(); }
    }
  }, [limit, requests]);
  useEffect(() => { void refresh(); return () => requests.cancel(); }, [refresh, requests]);
  return { destaques, loading, error, refresh };
}

export function useNoticia(slug: string) {
  const [requests] = useState(createLatestRequest);
  const [noticia, setNoticia] = useState<NoticiaAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const request = requests.begin();
    setLoading(!!slug);
    setError(null);
    setNoticia(null);
    if (slug) void (async () => {
      try {
        const response = await fetch(`/api/noticias/${encodeURIComponent(slug)}`, { signal: request.signal });
        const data = await response.json().catch(() => null);
        if (response.status === 404) throw new ApiError('Notícia não encontrada.', 'invalid');
        if (!response.ok) throw apiError(response, data, 'Não foi possível carregar a notícia. Tente novamente.');
        if (request.isCurrent()) setNoticia(data.noticia ?? null);
      } catch (failure) {
        if (request.isCurrent()) setError(failureMessage(failure));
      } finally {
        if (request.isCurrent()) { setLoading(false); request.finish(); }
      }
    })();
    return () => requests.cancel();
  }, [slug, requests]);
  return { noticia, loading, error };
}

function useNewsQuery<T>(initial: T, run: (query: string, signal: AbortSignal) => Promise<T>) {
  const [requests] = useState(createLatestRequest);
  const [result, setResult] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  useEffect(() => () => requests.cancel(), [requests]);
  const clear = useCallback(() => {
    requests.cancel();
    setResult(initial);
    setLoading(false);
    setSearched(false);
    setError(null);
  }, [requests, initial]);
  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) { clear(); return; }
    const request = requests.begin();
    setLoading(true);
    setError(null);
    setSearched(true);
    setResult(initial);
    try {
      const value = await run(q, request.signal);
      if (request.isCurrent()) setResult(value);
    } catch (failure) {
      if (!request.isCurrent()) return;
      setError(failureMessage(failure));
      setRetryAt(failure instanceof ApiError ? failure.retryAt : null);
    } finally {
      if (request.isCurrent()) { setLoading(false); request.finish(); }
    }
  }, [requests, run, initial, clear]);
  return { result, loading, error, searched, retryAt, search, clear };
}
async function searchArchive(query: string, signal: AbortSignal) {
  return deduplicateById(await readNews(await fetch(`/api/noticias/busca?q=${encodeURIComponent(query)}&limit=20`, { signal })));
}
async function searchAI(query: string, signal: AbortSignal): Promise<string | null> {
  const response = await fetch('/api/noticias/gpt-busca', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ termo: query }), signal,
  });
  const data = await response.json().catch(() => null);
  // A 404 here means a valid search with no articles in the archive.
  if (response.status === 404) return null;
  if (!response.ok) throw apiError(response, data, 'Não foi possível gerar o resumo com IA. Tente novamente.');
  if (typeof data?.noticias !== 'string') throw new ApiError('Não conseguimos abrir o resumo. Tente novamente.', 'unavailable');
  return data.noticias.trim() || null;
}
export function useBuscaNoticias() {
  const { result: results, ...rest } = useNewsQuery(EMPTY_NEWS, searchArchive);
  return { results, ...rest };
}
export function useBuscaIA() {
  const { result: content, ...rest } = useNewsQuery<string | null>(null, searchAI);
  return { content, ...rest };
}

export function useRelatedNoticias(tags: string[], excludeSlug: string, limit = 3) {
  const [requests] = useState(createLatestRequest);
  const [related, setRelated] = useState<NoticiaAPI[]>(EMPTY_NEWS);
  const [loading, setLoading] = useState(tags.length > 0);
  const tag = tags[0] ?? '';
  useEffect(() => {
    const request = requests.begin();
    setLoading(!!tag);
    setRelated(EMPTY_NEWS);
    if (tag) void (async () => {
      try {
        const items = await readNews(await fetch(`/api/noticias?tag=${encodeURIComponent(tag)}&limit=${limit + 1}&offset=0`, { signal: request.signal }));
        if (request.isCurrent()) setRelated(deduplicateById(items).filter((item) => item.slug !== excludeSlug).slice(0, limit));
      } catch { /* Related content is optional. */ }
      finally { if (request.isCurrent()) { setLoading(false); request.finish(); } }
    })();
    return () => requests.cancel();
  }, [tag, excludeSlug, limit, requests]);
  return { related: tag ? related : EMPTY_NEWS, loading: !!tag && loading };
}
