import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUser } from '@/lib/server/auth-request';
import { getEssayById } from '@/lib/db/repositories/essays';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    return auth.error;
  }

  const supabase = auth.supabase as SupabaseClient<Database>;
  const userId = auth.userId;

  const params = await context.params;
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  // M10: Validate UUID format
  if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const result = await getEssayById(supabase, id, userId);
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
