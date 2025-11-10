export function sanitizeRedirectPath(value: string | undefined | null, fallback: string = '/conta') {
  if (!value) {
    return fallback;
  }

  if (!value.startsWith('/')) {
    return fallback;
  }

  if (value.startsWith('//')) {
    return fallback;
  }

  return value;
}
