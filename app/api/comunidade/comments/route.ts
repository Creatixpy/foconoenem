import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/server/auth-request';
import { z } from 'zod';
import { sanitizeString } from '@/lib/security';

const commentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1).max(2000).transform((s) => sanitizeString(s.replace(/[<>]/g, ''))),
});

export async function POST(request: NextRequest) {
  const auth = await resolveRequestUser(request);
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

  const parsed = commentSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Post e conteúdo são obrigatórios.' }, { status: 400 });
  }

  const { postId, content } = parsed.data;

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
