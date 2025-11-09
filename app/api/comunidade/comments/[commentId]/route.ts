import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUser } from '@/lib/server/auth-request';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ commentId: string | string[] }> }
) {
  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;
  const params = await context.params;
  const rawId = Array.isArray(params.commentId) ? params.commentId[0] : params.commentId;

  if (!rawId) {
    return NextResponse.json({ error: 'ID do comentário não fornecido.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('community_comments')
    .delete()
    .eq('id', rawId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao remover comentário da comunidade:', error);
    return NextResponse.json({ error: 'Falha ao remover comentário.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
