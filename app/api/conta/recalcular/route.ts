import { NextRequest, NextResponse } from 'next/server';
import { recalculateContaStatistics } from '@/lib/server/conta';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const data = await recalculateContaStatistics(auth.userId);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erro ao recalcular estatísticas:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
