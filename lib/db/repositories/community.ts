/**
 * Community Repository
 * Database operations for community posts, comments, and likes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../client';
import { toCommunityPost } from '../transformers';
import type {
  CommunityPost,
  CommunityPostRow,
  CommunityCommentRow,
  CommunityTopicRow,
  PaginatedResult,
} from '../types';

// ============================================================================
// Topics Operations
// ============================================================================

export async function listTopics(
  client: SupabaseClient<Database>
): Promise<CommunityTopicRow[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_topics')
      .select('*')
      .order('title', { ascending: true })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  }, 'fast');

  return data;
}

export async function getTopicBySlug(
  client: SupabaseClient<Database>,
  slug: string
): Promise<CommunityTopicRow | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_topics')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .abortSignal(signal);

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  }, 'fast');

  return data;
}

// ============================================================================
// Posts Operations
// ============================================================================

export async function listPosts(
  client: SupabaseClient<Database>,
  options?: {
    topicId?: string;
    limit?: number;
    page?: number;
    currentUserId?: string;
  }
): Promise<PaginatedResult<CommunityPost>> {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;
  const offset = (page - 1) * limit;

  const { data, total } = await withTimeout(async (signal) => {
    let query = client
      .from('community_posts')
      .select('*', { count: 'exact' })
      .eq('status', 'published');

    if (options?.topicId) {
      query = query.eq('topic_id', options.topicId);
    }

    const { data, error, count } = await query
      .order('last_activity_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return { data: data ?? [], total: count ?? 0 };
  });

  // Get author info separately
  const userIds = [...new Set(data.map((p) => p.user_id))];
  const { data: profiles } = await client
    .from('user_profiles')
    .select('user_id, nome_completo, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, { nome_completo: p.nome_completo, avatar_url: p.avatar_url }]) ?? []
  );

  // Transform results
  const posts: CommunityPost[] = data.map((row) => {
    const postRow = row as CommunityPostRow;
    const author = profileMap.get(postRow.user_id);

    return toCommunityPost(postRow, {
      author: author ?? undefined,
      likesCount: 0,
      commentsCount: 0,
    });
  });

  // Check if current user has liked each post
  if (options?.currentUserId && posts.length > 0) {
    const postIds = posts.map((p) => p.id);
    const { data: userLikes } = await client
      .from('community_post_likes')
      .select('post_id')
      .eq('user_id', options.currentUserId)
      .in('post_id', postIds);

    const likedPostIds = new Set(userLikes?.map((l) => l.post_id) ?? []);
    posts.forEach((post) => {
      post.userHasLiked = likedPostIds.has(post.id);
    });
  }

  return {
    data: posts,
    total,
    page,
    limit,
    hasMore: offset + posts.length < total,
  };
}

export async function getPostById(
  client: SupabaseClient<Database>,
  postId: string,
  currentUserId?: string
): Promise<CommunityPost | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_posts')
      .select('*')
      .eq('id', postId)
      .maybeSingle()
      .abortSignal(signal);

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  if (!data) return null;

  const postRow = data as CommunityPostRow;

  // Get author info
  const { data: profile } = await client
    .from('user_profiles')
    .select('nome_completo, avatar_url')
    .eq('user_id', postRow.user_id)
    .maybeSingle();

  const post = toCommunityPost(postRow, {
    author: profile ?? undefined,
    likesCount: 0,
    commentsCount: 0,
  });

  // Check if current user has liked
  if (currentUserId) {
    const { data: like } = await client
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', currentUserId)
      .maybeSingle();

    post.userHasLiked = !!like;
  }

  return post;
}

export async function createPost(
  client: SupabaseClient<Database>,
  userId: string,
  post: {
    topicId: string;
    title: string;
    content: string;
  }
): Promise<CommunityPost> {
  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_posts')
      .insert({
        topic_id: post.topicId,
        user_id: userId,
        title: post.title,
        content: post.content,
        status: 'published',
      })
      .select('*')
      .single()
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  const postRow = result as CommunityPostRow;

  // Get author info
  const { data: profile } = await client
    .from('user_profiles')
    .select('nome_completo, avatar_url')
    .eq('user_id', userId)
    .maybeSingle();

  return toCommunityPost(postRow, {
    author: profile ?? undefined,
    likesCount: 0,
    commentsCount: 0,
    userHasLiked: false,
  });
}

export async function deletePost(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('community_posts')
      .update({ status: 'archived' })
      .eq('id', postId)
      .eq('user_id', userId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

// ============================================================================
// Comments Operations
// ============================================================================

export async function listComments(
  client: SupabaseClient<Database>,
  postId: string,
  options?: { limit?: number; offset?: number }
): Promise<(CommunityCommentRow & { author: { nome_completo: string | null; avatar_url: string | null } })[]> {
  const limit = options?.limit ?? 50;
  const offset = options?.offset ?? 0;

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('status', 'visible')
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  // Get author info for all comments
  const userIds = [...new Set(data.map((c) => c.user_id))];
  const { data: profiles } = await client
    .from('user_profiles')
    .select('user_id, nome_completo, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map(
    profiles?.map((p) => [p.user_id, { nome_completo: p.nome_completo, avatar_url: p.avatar_url }]) ?? []
  );

  return data.map((comment) => ({
    ...comment,
    author: profileMap.get(comment.user_id) ?? { nome_completo: null, avatar_url: null },
  }));
}

export async function createComment(
  client: SupabaseClient<Database>,
  userId: string,
  comment: {
    postId: string;
    content: string;
  }
): Promise<CommunityCommentRow> {
  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_comments')
      .insert({
        post_id: comment.postId,
        user_id: userId,
        content: comment.content,
        status: 'visible',
      })
      .select()
      .single()
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);

    // Update post's last_activity_at
    await client
      .from('community_posts')
      .update({ last_activity_at: new Date().toISOString() })
      .eq('id', comment.postId)
      .abortSignal(signal);

    return data;
  });

  return result;
}

export async function deleteComment(
  client: SupabaseClient<Database>,
  commentId: string,
  userId: string
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('community_comments')
      .update({ status: 'hidden' })
      .eq('id', commentId)
      .eq('user_id', userId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

export async function getCommentsCount(
  client: SupabaseClient<Database>,
  postId: string
): Promise<number> {
  const data = await withTimeout(async (signal) => {
    const { count, error } = await client
      .from('community_comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .eq('status', 'visible')
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return count ?? 0;
  }, 'fast');

  return data;
}

// ============================================================================
// Likes Operations
// ============================================================================

export async function togglePostLike(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<{ liked: boolean; likesCount: number }> {
  const result = await withTimeout(async (signal) => {
    // Check if already liked
    const { data: existing } = await client
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()
      .abortSignal(signal);

    if (existing) {
      // Unlike
      await client
        .from('community_post_likes')
        .delete()
        .eq('id', existing.id)
        .abortSignal(signal);
    } else {
      // Like
      await client
        .from('community_post_likes')
        .insert({ post_id: postId, user_id: userId })
        .abortSignal(signal);
    }

    // Get updated count
    const { count } = await client
      .from('community_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .abortSignal(signal);

    return {
      liked: !existing,
      likesCount: count ?? 0,
    };
  });

  return result;
}

export async function getPostLikesCount(
  client: SupabaseClient<Database>,
  postId: string
): Promise<number> {
  const data = await withTimeout(async (signal) => {
    const { count, error } = await client
      .from('community_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', postId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return count ?? 0;
  }, 'fast');

  return data;
}

export async function hasUserLikedPost(
  client: SupabaseClient<Database>,
  postId: string,
  userId: string
): Promise<boolean> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle()
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return !!data;
  }, 'fast');

  return data;
}
