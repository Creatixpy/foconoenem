import {
  CANONICAL_SITE_ORIGIN,
  LEGACY_PUBLIC_REDIRECTS_ENABLED,
  LEGACY_SITE_HOST,
} from '@/lib/constants/site';

const PUBLIC_CONTENT_PATHS = new Set([
  '/', '/sobre', '/privacidade', '/termos', '/noticias', '/noticias/pesquisa',
]);

export function isPublicContentPath(pathname: string): boolean {
  const path = pathname === '/' ? pathname : pathname.replace(/\/$/, '');
  if (PUBLIC_CONTENT_PATHS.has(path)) return true;
  if (!/^\/noticias\/[^/]+$/.test(path)) return false;
  try { return decodeURIComponent(path.slice('/noticias/'.length)) !== 'admin'; }
  catch { return false; }
}

export function getLegacyPublicRedirect(
  requestUrl: URL,
  method: string,
  enabled = LEGACY_PUBLIC_REDIRECTS_ENABLED,
): URL | null {
  if (!enabled || requestUrl.hostname !== LEGACY_SITE_HOST ||
      (method !== 'GET' && method !== 'HEAD') || !isPublicContentPath(requestUrl.pathname)) {
    return null;
  }

  const destination = new URL(CANONICAL_SITE_ORIGIN);
  destination.pathname = requestUrl.pathname;
  destination.search = requestUrl.search;
  return destination;
}
