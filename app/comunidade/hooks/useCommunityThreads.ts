'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface ThreadComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Thread {
  id: string;
  title: string;
  content: string;
  topic_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  last_activity_at: string;
  comments: ThreadComment[];
}

export interface AuthorProfile {
  user_id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  community_tagline: string | null;
  community_show_statistics: boolean;
}

export interface LikeInfo {
  post_id: string;
  user_id: string;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
export function useCommunityThreads(topicId: string | null, userId: string | null) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [profiles, setProfiles] = useState<Record<string, AuthorProfile>>({});
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // ── Fetch threads ──────────────────────────────────
  const fetchThreads = useCallback(async () => {
    if (!topicId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comunidade/threads?topicId=${topicId}&limit=30`);
      if (!res.ok) throw new Error('Erro ao carregar posts');
      const data = await res.json();
      const fetchedThreads: Thread[] = data.threads ?? [];
      setThreads(fetchedThreads);

      // Fetch profiles + likes in parallel
      const userIds = new Set<string>();
      const postIds: string[] = [];
      for (const t of fetchedThreads) {
        userIds.add(t.user_id);
        postIds.push(t.id);
        for (const c of t.comments) userIds.add(c.user_id);
      }

      const [profilesRes, likesRes] = await Promise.all([
        userIds.size > 0
          ? fetch('/api/comunidade/profiles', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ userIds: Array.from(userIds) }),
            }).then((r) => r.json()).catch(() => ({ profiles: [] }))
          : { profiles: [] },
        postIds.length > 0
          ? fetch('/api/comunidade/likes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ postIds }),
            }).then((r) => r.json()).catch(() => ({ likes: [] }))
          : { likes: [] },
      ]);

      // Map profiles
      const profileMap: Record<string, AuthorProfile> = {};
      for (const p of profilesRes.profiles ?? []) {
        profileMap[p.user_id] = p;
      }
      setProfiles(profileMap);

      // Map likes
      const liked = new Set<string>();
      const counts: Record<string, number> = {};
      for (const l of likesRes.likes ?? []) {
        if (!counts[l.post_id]) counts[l.post_id] = 0;
        counts[l.post_id]++;
        if (l.user_id === userId) liked.add(l.post_id);
      }
      setLikedPosts(liked);
      setLikeCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [topicId, userId]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // ── SSE realtime ───────────────────────────────────
  useEffect(() => {
    if (!topicId) return;
    const es = new EventSource(`/api/realtime-proxy?topicId=${topicId}`);
    eventSourceRef.current = es;

    es.addEventListener('post_insert', (e) => {
      try {
        const data = JSON.parse(e.data);
        const newPost = data?.new ?? data;
        if (newPost && newPost.topic_id === topicId && newPost.status === 'published') {
          setThreads((prev) => {
            if (prev.some((t) => t.id === newPost.id)) return prev;
            return [{ ...newPost, comments: [] }, ...prev];
          });
        }
      } catch { /* ignore */ }
    });

    es.addEventListener('comment_insert', (e) => {
      try {
        const data = JSON.parse(e.data);
        const newComment = data?.new ?? data;
        if (newComment && newComment.status === 'visible') {
          setThreads((prev) =>
            prev.map((t) =>
              t.id === newComment.post_id && !t.comments.some((c) => c.id === newComment.id)
                ? { ...t, comments: [...t.comments, newComment] }
                : t
            )
          );
        }
      } catch { /* ignore */ }
    });

    es.onerror = () => {
      // Let EventSource retry automatically and refresh state opportunistically.
      setTimeout(() => {
        if (eventSourceRef.current === es) {
          void fetchThreads();
        }
      }, 1500);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [fetchThreads, topicId]);

  // ── Create post ────────────────────────────────────
  const createPost = useCallback(
    async (title: string, content: string) => {
      if (!topicId) throw new Error('Tópico não selecionado');
      const res = await fetch('/api/comunidade/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, content, topicId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao publicar');
      }
      const data = await res.json();
      const newPost = data.post;
      setThreads((prev) => {
        if (prev.some((t) => t.id === newPost.id)) return prev;
        return [{ ...newPost, comments: [] }, ...prev];
      });
      return newPost;
    },
    [topicId]
  );

  // ── Create comment ─────────────────────────────────
  const createComment = useCallback(async (postId: string, content: string) => {
    const res = await fetch('/api/comunidade/comments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, content }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Erro ao comentar');
    }
    const data = await res.json();
    const newComment = data.comment;
    setThreads((prev) =>
      prev.map((t) =>
        t.id === postId && !t.comments.some((c) => c.id === newComment.id)
          ? { ...t, comments: [...t.comments, newComment] }
          : t
      )
    );
    return newComment;
  }, []);

  // ── Toggle like (optimistic) ───────────────────────
  const toggleLike = useCallback(
    async (postId: string) => {
      const wasLiked = likedPosts.has(postId);

      // Optimistic update
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(postId);
        else next.add(postId);
        return next;
      });
      setLikeCounts((prev) => ({
        ...prev,
        [postId]: (prev[postId] ?? 0) + (wasLiked ? -1 : 1),
      }));

      try {
        const res = await fetch(`/api/comunidade/posts/${postId}/likes`, {
          method: wasLiked ? 'DELETE' : 'POST',
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setLikeCounts((prev) => ({ ...prev, [postId]: data.count }));
      } catch {
        // Revert on failure
        setLikedPosts((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setLikeCounts((prev) => ({
          ...prev,
          [postId]: (prev[postId] ?? 0) + (wasLiked ? 1 : -1),
        }));
      }
    },
    [likedPosts]
  );

  // ── Delete post ────────────────────────────────────
  const deletePost = useCallback(async (postId: string) => {
    const res = await fetch(`/api/comunidade/posts/${postId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir post');
    setThreads((prev) => prev.filter((t) => t.id !== postId));
  }, []);

  // ── Delete comment ─────────────────────────────────
  const deleteComment = useCallback(async (commentId: string) => {
    const res = await fetch(`/api/comunidade/comments/${commentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Erro ao excluir comentário');
    setThreads((prev) =>
      prev.map((t) => ({
        ...t,
        comments: t.comments.filter((c) => c.id !== commentId),
      }))
    );
  }, []);

  return {
    threads,
    profiles,
    likedPosts,
    likeCounts,
    loading,
    error,
    refetch: fetchThreads,
    createPost,
    createComment,
    toggleLike,
    deletePost,
    deleteComment,
  };
}
