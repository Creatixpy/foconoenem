import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/server/auth-request';

export async function POST(request: NextRequest) {
  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;

  let payload: { postId?: unknown; content?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const postId = typeof payload.postId === 'string' ? payload.postId : null;
  const content = typeof payload.content === 'string' ? payload.content.trim() : '';

  if (!postId || !content) {
    return NextResponse.json({ error: 'Post e conteúdo são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar comentário na comunidade:', error);
    return NextResponse.json({ error: 'Falha ao enviar comentário.' }, { status: 500 });
  }

  return NextResponse.json({ comment: data });
}
