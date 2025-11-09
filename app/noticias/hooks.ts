'use client';

import { useCallback, useEffect, useRef, useState } from "react";
import type { Noticia } from "@/types";
import { getNoticias, getNoticiasDestaque } from "@/lib/supabase";
import { withTimeout } from "@/lib/with-timeout";
import { isAbortError } from "@/lib/errors";

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
  const inFlightRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchFeed = useCallback(async () => {
    if (inFlightRef.current) {
      return;
    }

    const currentPage = Math.max(1, page);
    const offset = (currentPage - 1) * limit;
    inFlightRef.current = true;

    setState((previous) => ({
      ...previous,
      loading: true,
      error: null,
    }));

    try {
      const noticias = await withTimeout(
        () => getNoticias(limit, offset),
        DEFAULT_TIMEOUT,
        "Tempo limite ao buscar notícias."
      );

      if (!mountedRef.current) {
        return;
      }

      setState((previous) => ({
        data: currentPage === 1 ? noticias : [...previous.data, ...noticias],
        loading: false,
        error: null,
        hasMore: noticias.length === limit,
      }));
    } catch (error) {
      console.error("Erro ao carregar notícias:", error);
      if (mountedRef.current) {
        setState((previous) => ({
          ...previous,
          loading: false,
          error: isAbortError(error) ? null : FEED_ERROR_MESSAGE,
        }));
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [limit, page]);

  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !inFlightRef.current) {
        void fetchFeed();
      }
    };

    const handleOnline = () => {
      if (!inFlightRef.current) {
        void fetchFeed();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleVisibility);
    window.addEventListener("online", handleOnline);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleVisibility);
      window.removeEventListener("online", handleOnline);
    };
  }, [fetchFeed]);

  return state;
}

export function useNoticiasHighlights(enabled: boolean): HighlightState {
  const [state, setState] = useState<HighlightState>({
    data: [],
    loading: false,
    error: null,
  });
  const inFlightRef = useRef(false);

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
      if (inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
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
        console.error("Erro ao carregar destaques:", error);
        if (!canceled) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: isAbortError(error) ? null : HIGHLIGHT_ERROR_MESSAGE,
          }));
        }
      }
      inFlightRef.current = false;
    }

    void fetchHighlights();

    return () => {
      canceled = true;
      inFlightRef.current = false;
    };
  }, [enabled]);

  return state;
}
