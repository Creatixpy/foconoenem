'use client';

import { useEffect, useState } from "react";
import type { Noticia } from "@/types";
import { getNoticias, getNoticiasDestaque } from "@/lib/supabase";
import { withTimeout } from "@/lib/with-timeout";

const DEFAULT_TIMEOUT = 10000;
const FEED_ERROR_MESSAGE = "Não foi possível carregar as notícias. Tente novamente mais tarde.";
const HIGHLIGHT_ERROR_MESSAGE = "Não foi possível carregar as notícias em destaque. Tente novamente mais tarde.";

type FeedState = {
  data: Noticia[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
};

type HighlightState = {
  data: Noticia[];
  loading: boolean;
  error: string | null;
};

export function useNoticiasFeed(page: number, limit: number): FeedState {
  const [state, setState] = useState<FeedState>({
    data: [],
    loading: false,
    error: null,
    hasMore: true,
  });

  useEffect(() => {
    let canceled = false;
    const currentPage = Math.max(1, page);
    const offset = (currentPage - 1) * limit;

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
      ...(currentPage === 1 ? { data: [] } : null),
    }));

    async function fetchFeed() {
      try {
        const noticias = await withTimeout(
          () => getNoticias(limit, offset),
          DEFAULT_TIMEOUT,
          "Tempo limite ao buscar notícias."
        );

        if (canceled) return;

        setState((previous) => ({
          data: currentPage === 1 ? noticias : [...previous.data, ...noticias],
          loading: false,
          error: null,
          hasMore: noticias.length === limit,
        }));
      } catch (error) {
        if (canceled) return;
        console.error("Erro ao carregar notícias:", error);
        setState((previous) => ({
          ...previous,
          loading: false,
          error: FEED_ERROR_MESSAGE,
        }));
      }
    }

    void fetchFeed();

    return () => {
      canceled = true;
    };
  }, [page, limit]);

  return state;
}

export function useNoticiasHighlights(enabled: boolean): HighlightState {
  const [state, setState] = useState<HighlightState>({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let canceled = false;
    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    async function fetchHighlights() {
      try {
        const noticias = await withTimeout(
          () => getNoticiasDestaque(),
          DEFAULT_TIMEOUT,
          "Tempo limite ao buscar notícias em destaque."
        );

        if (canceled) return;

        setState({
          data: noticias,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (canceled) return;
        console.error("Erro ao carregar destaques:", error);
        setState({
          data: [],
          loading: false,
          error: HIGHLIGHT_ERROR_MESSAGE,
        });
      }
    }

    void fetchHighlights();

    return () => {
      canceled = true;
    };
  }, [enabled]);

  return state;
}
