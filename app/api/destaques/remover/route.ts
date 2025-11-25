import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db';

export async function POST(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  const auth = await authorizeAdmin(request, { allowCron: true });
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message ?? 'Acesso negado.' },
      { status: auth.status ?? 401 }
    );
  }

  let payload: { id?: string } | null = null;
  try {
    payload = (await request.json()) as { id?: string } | null;
  } catch {
    return NextResponse.json({ error: 'JSON inválido.' }, { status: 400 });
  }

  const id = payload?.id;
  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'ID não fornecido.' }, { status: 400 });
  }

  const { error } = await supabase.from('noticias').update({ destaque: false }).eq('id', id);

  if (error) {
    console.error('Erro ao remover destaque:', error);
    return NextResponse.json({ error: 'Erro ao remover destaque.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Destaque removido com sucesso.' });
}
