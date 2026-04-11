import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

async function getLikeCount(supabase: SupabaseClient<Database>, postId: string) {
  const { count } = await supabase
    .from('community_post_likes')
    .select('*', { head: true, count: 'exact' })
    .eq('post_id', postId);
  return count ?? 0;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string | string[] }> }
) {
  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;
  const params = await context.params;
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  if (!postId) {
    return NextResponse.json({ error: 'ID do post não fornecido.' }, { status: 400 });
  }

  const { error } = await supabase.from('community_post_likes').insert({
    post_id: postId,
    user_id: userId,
  });

  if (error && error.code !== '23505') {
    console.error('Erro ao curtir post:', error);
    return NextResponse.json({ error: 'Falha ao curtir post.' }, { status: 500 });
  }

  const count = await getLikeCount(supabase, postId);
  return NextResponse.json({ liked: true, count });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string | string[] }> }
) {
  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;
  const params = await context.params;
  const postId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  if (!postId) {
    return NextResponse.json({ error: 'ID do post não fornecido.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('community_post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao remover curtida do post:', error);
    return NextResponse.json({ error: 'Falha ao remover curtida.' }, { status: 500 });
  }

  const count = await getLikeCount(supabase, postId);
  return NextResponse.json({ liked: false, count });
}
