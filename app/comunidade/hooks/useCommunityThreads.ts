"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, withSupabaseTimeout } from "@/lib/supabase";

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
  const channelRef = useRef<RealtimeChannel | null>(null);

  const onThreadsLoaded = options?.onThreadsLoaded;
  const onPostInserted = options?.onPostInserted;
  const onCommentInserted = options?.onCommentInserted;

  const loadThreads = useCallback(async () => {
    if (!topicId) {
      setThreads([]);
      setPostLikes({});
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: postsData, error: postsError } = await withSupabaseTimeout(async (signal) => {
        return await supabase
          .from("community_posts")
          .select("*")
          .eq("topic_id", topicId)
          .order("created_at", { ascending: false })
          .limit(25)
          .abortSignal(signal);
      });

      if (postsError) {
        throw postsError;
      }

      const postsList = postsData ?? [];
      const postIds = postsList.map((post) => post.id);

      let comments: CommunityComment[] = [];
      if (postIds.length > 0) {
        const { data: commentsData, error: commentsError } = await withSupabaseTimeout(async (signal) => {
          return await supabase
            .from("community_comments")
            .select("*")
            .in("post_id", postIds)
            .order("created_at", { ascending: true })
            .abortSignal(signal);
        });

        if (commentsError) {
          throw commentsError;
        }

        comments = commentsData ?? [];
      }

      const commentsByPost = comments.reduce<Record<string, CommunityComment[]>>((accumulator, comment) => {
        accumulator[comment.post_id] = accumulator[comment.post_id]
          ? [...accumulator[comment.post_id], comment]
          : [comment];
        return accumulator;
      }, {});

      const normalizedThreads = postsList.map((post) => ({
        ...post,
        comments: commentsByPost[post.id] ?? [],
      }));

      setThreads(normalizedThreads);
      onThreadsLoaded?.(normalizedThreads);
    } catch (loadError) {
      console.error("Erro ao carregar posts:", loadError);
      setError("Não foi possível carregar os posts deste tópico no momento.");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, [topicId, onThreadsLoaded]);

  useEffect(() => {
    void loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    if (!topicId) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel(`community-feed-${topicId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          const newPost = payload.new as CommunityPost;
          if (newPost.topic_id !== topicId) return;

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

          onPostInserted?.(newPost);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comments" },
        (payload) => {
          const newComment = payload.new as CommunityComment;
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

          onCommentInserted?.(newComment);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [topicId, userId, onPostInserted, onCommentInserted]);

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
