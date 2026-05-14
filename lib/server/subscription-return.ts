import 'server-only';

const ALLOWED_SUBSCRIPTION_RETURN_PATHS = new Set(['/conta', '/planos']);
const DEFAULT_SUBSCRIPTION_RETURN_PATH = '/conta';

export function normalizeSubscriptionReturnPath(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_SUBSCRIPTION_RETURN_PATH;
  }

  try {
    if (!value.startsWith('/') || value.startsWith('//')) {
      return DEFAULT_SUBSCRIPTION_RETURN_PATH;
    }

    const parsed = new URL(value, 'https://foconoenem.local');
    if (!ALLOWED_SUBSCRIPTION_RETURN_PATHS.has(parsed.pathname)) {
      return DEFAULT_SUBSCRIPTION_RETURN_PATH;
    }

    return parsed.pathname;
  } catch {
    return DEFAULT_SUBSCRIPTION_RETURN_PATH;
  }
}

export function buildSubscriptionReturnUrl(
  origin: string,
  returnPath: string,
  state?: 'success' | 'canceled'
) {
  const normalizedPath = normalizeSubscriptionReturnPath(returnPath);
  const url = new URL(normalizedPath, origin);
  if (state) {
    url.searchParams.set('subscription', state);
  }

  return url.toString();
}
