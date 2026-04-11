import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';

const PROFILE_FIELDS =
  'user_id,nome_completo,avatar_url,community_tagline,community_show_statistics';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  let payload: { userIds?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const userIds = Array.isArray(payload.userIds)
    ? payload.userIds.filter((value): value is string => typeof value === 'string').slice(0, 100)
    : [];

  if (userIds.length === 0) {
    return NextResponse.json({ profiles: [] });
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select(PROFILE_FIELDS)
    .in('user_id', userIds);

  if (error) {
    console.error('Erro ao buscar perfis da comunidade:', error);
    return NextResponse.json({ error: 'Falha ao buscar perfis.' }, { status: 500 });
  }

  return NextResponse.json({ profiles: data ?? [] });
}
