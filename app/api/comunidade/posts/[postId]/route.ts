import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

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
  const rawId = Array.isArray(params.postId) ? params.postId[0] : params.postId;

  if (!rawId) {
    return NextResponse.json({ error: 'ID do post não fornecido.' }, { status: 400 });
  }

  const { error } = await supabase
    .from('community_posts')
    .delete()
    .eq('id', rawId)
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao remover post da comunidade:', error);
    return NextResponse.json({ error: 'Falha ao remover post.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
