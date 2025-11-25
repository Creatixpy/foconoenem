"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isAbortError } from "@/lib/errors";

export type CommunityPost = {
  id: string;
  topic_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

export type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type CommunityThread = CommunityPost & { comments: CommunityComment[] };

type UseCommunityThreadsOptions = {
  onThreadsLoaded?: (threads: CommunityThread[]) => void;
  onPostInserted?: (post: CommunityPost) => void;
  onCommentInserted?: (comment: CommunityComment) => void;
};

export function useCommunityThreads(
  topicId: string | null,
  userId: string | null,
  options?: UseCommunityThreadsOptions
) {
  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [postLikes, setPostLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [commentCount, setCommentCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFetchingRef = useRef(false);
  const hasLoadedRef = useRef<string | null>(null);

  // Store options in refs to avoid dependency issues
  const onThreadsLoadedRef = useRef<UseCommunityThreadsOptions['onThreadsLoaded']>(options?.onThreadsLoaded);
  const onPostInsertedRef = useRef<UseCommunityThreadsOptions['onPostInserted']>(options?.onPostInserted);
  const onCommentInsertedRef = useRef<UseCommunityThreadsOptions['onCommentInserted']>(options?.onCommentInserted);

  useEffect(() => {
    onThreadsLoadedRef.current = options?.onThreadsLoaded;
    onPostInsertedRef.current = options?.onPostInserted;
    onCommentInsertedRef.current = options?.onCommentInserted;
  }, [options?.onThreadsLoaded, options?.onPostInserted, options?.onCommentInserted]);

  const loadThreads = useCallback(async () => {
    if (isFetchingRef.current) {
      return;
    }
    if (!topicId) {
      setThreads([]);
      setPostLikes({});
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);
      setError(null);

      const fetchedThreads = await fetchCommunityThreads(topicId, 25);
      setThreads(fetchedThreads);
      hasLoadedRef.current = topicId;
      onThreadsLoadedRef.current?.(fetchedThreads);
    } catch (loadError) {
      if (isAbortError(loadError)) {
        console.warn("Requisição abortada ao carregar posts, aguardando nova tentativa.", loadError);
        setError("Conexão instável. Tentaremos novamente ao retomar a aba.");
      } else {
        console.error("Erro ao carregar posts:", loadError);
        setError("Não foi possível carregar os posts deste tópico no momento.");
        setThreads([]);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [topicId]);

  // Store loadThreads in ref for event handlers
  const loadThreadsRef = useRef(loadThreads);
  useEffect(() => {
    loadThreadsRef.current = loadThreads;
  }, [loadThreads]);

  // Initial load when topic changes
  useEffect(() => {
    // Only load if topic changed from what we already loaded
    if (topicId && hasLoadedRef.current !== topicId) {
      void loadThreads();
    } else if (!topicId) {
      setThreads([]);
      setPostLikes({});
      hasLoadedRef.current = null;
    }
  }, [topicId, loadThreads]);

  // Visibility and online handlers - use ref for loadThreads
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && !isFetchingRef.current) {
        void loadThreadsRef.current();
      }
    };

    const handleOnline = () => {
      if (!isFetchingRef.current) {
        void loadThreadsRef.current();
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
  }, []); // No dependencies - uses refs

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    let disposed = false;

    const closeEventSource = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };

    const handlePostInserted = (newPost: CommunityPost) => {
      if (newPost.topic_id !== topicId) {
        return;
      }

      setThreads((previous) => {
        if (previous.some((thread) => thread.id === newPost.id)) {
          return previous;
        }
        return [{ ...newPost, comments: [] }, ...previous];
      });

      setPostLikes((previous) => ({
        ...previous,
        [newPost.id]: previous[newPost.id] ?? { count: 0, liked: false },
      }));

      onPostInsertedRef.current?.(newPost);
    };

    const handleCommentInserted = (newComment: CommunityComment) => {
      setThreads((previous) =>
        previous.map((thread) => {
          if (thread.id === newComment.post_id) {
            return { ...thread, comments: [...thread.comments, newComment] };
          }
          return thread;
        })
      );

      if (newComment.user_id === userId) {
        setCommentCount((prev) => prev + 1);
      }

      onCommentInsertedRef.current?.(newComment);
    };

    const scheduleReconnect = () => {
      if (disposed || reconnectTimeoutRef.current) {
        return;
      }
      reconnectTimeoutRef.current = setTimeout(() => {
        reconnectTimeoutRef.current = null;
        connect();
      }, 3000);
    };

    const connect = () => {
      if (!topicId) {
        closeEventSource();
        return;
      }

      const params = new URLSearchParams({ topicId });
      closeEventSource();
      const source = new EventSource(`/api/realtime-proxy?${params.toString()}`);
      eventSourceRef.current = source;

      source.addEventListener("post_insert", (event) => {
        const newPost = parseSseData<CommunityPost>(event);
        if (newPost) {
          handlePostInserted(newPost);
        }
      });

      source.addEventListener("comment_insert", (event) => {
        const newComment = parseSseData<CommunityComment>(event);
        if (newComment) {
          handleCommentInserted(newComment);
        }
      });

      const handleFailure = () => {
        closeEventSource();
        scheduleReconnect();
      };

      source.addEventListener("proxy_error", handleFailure);
      source.onerror = handleFailure;
    };

    connect();

    return () => {
      disposed = true;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      closeEventSource();
    };
  }, [topicId, userId]);

  return {
    threads,
    setThreads,
    loading,
    error,
    reload: loadThreads,
    postLikes,
    setPostLikes,
    commentCount,
    setCommentCount,
  };
}

function parseSseData<T>(event: Event): T | null {
  const message = event as MessageEvent<string>;
  try {
    return JSON.parse(message.data) as T;
  } catch (parseError) {
    console.error("Falha ao interpretar evento SSE", parseError);
    return null;
  }
}

async function fetchCommunityThreads(topicId: string, limit: number): Promise<CommunityThread[]> {
  const params = new URLSearchParams({
    topicId,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/comunidade/threads?${params.toString()}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`API de threads respondeu ${response.status}`);
  }

  const payload = (await response.json()) as { threads?: CommunityThread[] };
  return payload.threads ?? [];
}
