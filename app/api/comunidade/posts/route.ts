import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security';

const postSchema = z.object({
  title: z.string().min(1).max(200).transform((s) => sanitizeString(s.replace(/[<>]/g, ''))),
  content: z.string().min(1).max(5000).transform((s) => sanitizeString(s.replace(/[<>]/g, ''))),
  topicId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const parsed = postSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Título, conteúdo e tópico são obrigatórios.' }, { status: 400 });
  }

  const { title, content, topicId } = parsed.data;

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
