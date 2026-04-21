'use client';

import { useState, useEffect, useCallback } from 'react';

// ---------------------------------------------------------------------------
// Types — API returns snake_case directly from database
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// useNoticias — paginated news list with optional destaque filter
// ---------------------------------------------------------------------------
export function useNoticias(pageSize = 9, initialNoticias: NoticiaAPI[] = []) {
  const [noticias, setNoticias] = useState<NoticiaAPI[]>(initialNoticias);
  const [loading, setLoading] = useState(initialNoticias.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(initialNoticias.length);
  const [hasMore, setHasMore] = useState(initialNoticias.length >= pageSize);

  const fetchPage = useCallback(
    async (currentOffset: number, append: boolean) => {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          limit: String(pageSize),
          offset: String(currentOffset),
        });
        const res = await fetch(`/api/noticias?${params}`);
        if (!res.ok) throw new Error('Erro ao carregar notícias');
        const data = await res.json();
        const items: NoticiaAPI[] = data.noticias ?? [];

        if (append) {
          setNoticias((prev) => [...prev, ...items]);
        } else {
          setNoticias(items);
        }
        setHasMore(items.length >= pageSize);
        setOffset(currentOffset + items.length);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [pageSize]
  );

  useEffect(() => {
    if (initialNoticias.length > 0) {
      return;
    }
    fetchPage(0, false);
  }, [fetchPage, initialNoticias.length]);

  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchPage(offset, true);
    }
  }, [offset, loadingMore, hasMore, fetchPage]);

  const refetch = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchPage(0, false);
  }, [fetchPage]);

  return { noticias, loading, loadingMore, error, hasMore, loadMore, refetch };
}

// ---------------------------------------------------------------------------
// useDestaques — featured articles
// ---------------------------------------------------------------------------
export function useDestaques(limit = 3, initialDestaques: NoticiaAPI[] = []) {
  const [destaques, setDestaques] = useState<NoticiaAPI[]>(initialDestaques);
  const [loading, setLoading] = useState(initialDestaques.length === 0);

  useEffect(() => {
    if (initialDestaques.length > 0) {
      return;
    }

    (async () => {
      try {
        const res = await fetch(`/api/noticias?destaque=true&limit=${limit}&offset=0`);
        if (!res.ok) return;
        const data = await res.json();
        setDestaques(data.noticias ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, [initialDestaques.length, limit]);

  return { destaques, loading };
}

// ---------------------------------------------------------------------------
// useNoticia — single article by slug
// ---------------------------------------------------------------------------
export function useNoticia(slug: string) {
  const [noticia, setNoticia] = useState<NoticiaAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/noticias/${encodeURIComponent(slug)}`);
        if (res.status === 404) {
          setError('Notícia não encontrada');
          setNoticia(null);
          return;
        }
        if (!res.ok) throw new Error('Erro ao carregar notícia');
        const data = await res.json();
        setNoticia(data.noticia ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  return { noticia, loading, error };
}

// ---------------------------------------------------------------------------
// useBuscaNoticias — keyword search
// ---------------------------------------------------------------------------
export function useBuscaNoticias() {
  const [results, setResults] = useState<NoticiaAPI[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const res = await fetch(`/api/noticias/busca?q=${encodeURIComponent(q)}&limit=20`);
      if (!res.ok) throw new Error('Erro na busca');
      const data = await res.json();
      setResults(data.noticias ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResults([]);
    setSearched(false);
    setError(null);
  }, []);

  return { results, loading, error, searched, search, clear };
}

// ---------------------------------------------------------------------------
// useBuscaIA — AI-powered search
// ---------------------------------------------------------------------------
export function useBuscaIA() {
  const [content, setContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setContent(null);
    try {
      const res = await fetch('/api/noticias/gpt-busca', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ termo: q }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Erro ao gerar resumo com IA');
      }
      setContent(data.noticias ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setContent(null);
    setError(null);
  }, []);

  return { content, loading, error, search, clear };
}

// ---------------------------------------------------------------------------
// useRelatedNoticias — articles by tag
// ---------------------------------------------------------------------------
export function useRelatedNoticias(tags: string[], excludeSlug: string, limit = 3) {
  const [related, setRelated] = useState<NoticiaAPI[]>([]);
  const [loading, setLoading] = useState(() => tags.length > 0);

  useEffect(() => {
    if (!tags.length) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/noticias?tag=${encodeURIComponent(tags[0])}&limit=${limit + 1}&offset=0`
        );
        if (!res.ok) return;
        const data = await res.json();
        const items: NoticiaAPI[] = (data.noticias ?? []).filter(
          (n: NoticiaAPI) => n.slug !== excludeSlug
        );
        if (!cancelled) {
          setRelated(items.slice(0, limit));
        }
      } catch { /* ignore */ }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tags, excludeSlug, limit]);

  return {
    related: tags.length ? related : [],
    loading: tags.length ? loading : false,
  };
}
