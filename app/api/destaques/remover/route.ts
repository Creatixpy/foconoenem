import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { authorizeAdmin, logAdminAction } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request, { allowMissingOriginForAuthHeader: true });
  if (originError) {
    return originError;
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Serviço indisponível.' },
      { status: 500 }
    );
  }

  const auth = await authorizeAdmin(request);
  if (!auth.authorized) {
    return NextResponse.json(
      { error: 'Acesso não autorizado.' },
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
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });
  }

  const { error } = await supabase.from('noticias').update({ destaque: false }).eq('id', id);

  if (error) {
    console.error('Erro ao remover destaque:', error);
    return NextResponse.json({ error: 'Erro ao remover destaque.' }, { status: 500 });
  }

  const adminEmail = auth.user.email ?? null;
  await logAdminAction(supabase, {
    adminEmail,
    action: 'highlights_remove',
    targetType: 'noticia',
    targetId: id,
  });
  revalidateTag('public-noticias', 'max');

  return NextResponse.json({ success: true, message: 'Destaque removido com sucesso.' });
}
