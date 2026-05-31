export function isAbortError(error: unknown): boolean {
  if (typeof window === 'undefined') {
    return (
      error instanceof Error &&
      'name' in error &&
      (error as { name?: string }).name === 'AbortError'
    );
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return true;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }

  if (typeof error === 'object' && error !== null && 'name' in error) {
    return (error as { name?: string }).name === 'AbortError';
  }

  return false;
}
