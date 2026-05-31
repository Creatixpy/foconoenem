import { NextRequest, NextResponse } from 'next/server';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { getEssayById } from '@/lib/db/repositories/essays';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  const originError = ensureTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  const userId = auth.userId;

  const params = await context.params;
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // M10: Validate UUID format
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const result = await getEssayById(adminClient, id, userId);
  if (!result) {
    return NextResponse.json({ error: 'Resultado não encontrado' }, { status: 404 });
  }

  await trackEvent({
    eventType: 'essay_viewed',
    metadata: { essay_id: id, from: 'resultados-route' },
    userIp: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    userId,
  });

  return NextResponse.json({ result });
}
