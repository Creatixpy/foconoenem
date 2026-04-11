import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/db/server';

export async function POST(request: NextRequest) {
  const supabase = await createServerClient();

  let payload: { postIds?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const postIds = Array.isArray(payload.postIds)
    ? payload.postIds.filter((value): value is string => typeof value === 'string').slice(0, 100)
    : [];

  if (postIds.length === 0) {
    return NextResponse.json({ likes: [] });
  }

  const { data, error } = await supabase
    .from('community_post_likes')
    .select('post_id,user_id')
    .in('post_id', postIds);

  if (error) {
    console.error('Erro ao carregar curtidas de posts:', error);
    return NextResponse.json({ error: 'Falha ao buscar curtidas.' }, { status: 500 });
  }

  return NextResponse.json({ likes: data ?? [] });
}
