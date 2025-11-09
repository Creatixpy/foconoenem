import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/server/auth-request';

export async function POST(request: NextRequest) {
  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;

  let payload: { title?: unknown; content?: unknown; topicId?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
  const content = typeof payload.content === 'string' ? payload.content.trim() : '';
  const topicId = typeof payload.topicId === 'string' ? payload.topicId : null;

  if (!title || !content || !topicId) {
    return NextResponse.json({ error: 'Título, conteúdo e tópico são obrigatórios.' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('community_posts')
    .insert({
      title,
      content,
      topic_id: topicId,
      user_id: userId,
    })
    .select('*')
    .single();

  if (error) {
    console.error('Erro ao criar post da comunidade:', error);
    return NextResponse.json({ error: 'Falha ao publicar post.' }, { status: 500 });
  }

  return NextResponse.json({ post: data });
}
