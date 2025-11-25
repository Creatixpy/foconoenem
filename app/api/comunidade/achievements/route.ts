import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  let payload: { userIds?: unknown };
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const userIds = Array.isArray(payload.userIds)
    ? payload.userIds.filter((value): value is string => typeof value === 'string')
    : [];

  if (userIds.length === 0) {
    return NextResponse.json({ achievements: [] });
  }

  const { data, error } = await supabase
    .from('user_achievements')
    .select('user_id,id,achievement_id,earned_at,metadata,achievement:achievements(*)')
    .in('user_id', userIds);

  if (error) {
    console.error('Erro ao buscar conquistas da comunidade:', error);
    return NextResponse.json({ error: 'Falha ao carregar conquistas.' }, { status: 500 });
  }

  return NextResponse.json({ achievements: data ?? [] });
}
