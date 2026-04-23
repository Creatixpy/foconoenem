import 'server-only';
import { NextRequest, NextResponse } from 'next/server';

function normalizeOrigin(candidate: string | null | undefined): string | null {
  if (!candidate) return null;

  try {
    if (candidate.startsWith('http://') || candidate.startsWith('https://')) {
      return new URL(candidate).origin;
    }

    return new URL(`https://${candidate}`).origin;
  } catch {
    return null;
  }
}

export function getAllowedOrigins(request: NextRequest): Set<string> {
  return new Set(
    [
      request.nextUrl.origin,
      process.env.NEXT_PUBLIC_SITE_URL,
      process.env.SITE_URL,
      process.env.VERCEL_PROJECT_PRODUCTION_URL,
      process.env.VERCEL_URL,
    ]
      .map((candidate) => normalizeOrigin(candidate))
      .filter((origin): origin is string => Boolean(origin))
  );
}

export function getRequestOrigin(request: NextRequest): string | null {
  return normalizeOrigin(
    request.headers.get('origin') ??
      request.headers.get('referer')
  );
}

function hasPrivilegedAuthHeader(request: NextRequest): boolean {
  return Boolean(request.headers.get('authorization'));
}

type EnsureTrustedOriginOptions = {
  allowMissingOriginForAuthHeader?: boolean;
};

export function ensureTrustedOrigin(
  request: NextRequest,
  options: EnsureTrustedOriginOptions = {}
): NextResponse | null {
  const { allowMissingOriginForAuthHeader = false } = options;
  const requestOrigin = getRequestOrigin(request);

  if (requestOrigin) {
    if (getAllowedOrigins(request).has(requestOrigin)) {
      return null;
    }

    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 });
  }

  const fetchSite = request.headers.get('sec-fetch-site');
  if (fetchSite === 'same-origin') {
    return null;
  }

  if (allowMissingOriginForAuthHeader && hasPrivilegedAuthHeader(request)) {
    return null;
  }

  return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 });
}
