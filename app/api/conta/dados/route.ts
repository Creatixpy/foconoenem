import { NextRequest, NextResponse } from 'next/server';
import { fetchContaData } from '@/lib/server/conta';
import { handleApiError } from '@/lib/security';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const data = await fetchContaData(auth.userId);
    return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}
