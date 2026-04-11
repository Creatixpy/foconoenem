import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

export async function GET(request: NextRequest) {
  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;

  const { count, error } = await supabase
    .from('community_comments')
    .select('*', { head: true, count: 'exact' })
    .eq('user_id', userId);

  if (error) {
    console.error('Erro ao contar comentários do usuário:', error);
    return NextResponse.json({ error: 'Falha ao carregar contagem de comentários.' }, { status: 500 });
  }

  return NextResponse.json({ count: count ?? 0 });
}
