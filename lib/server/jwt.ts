export function extractUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  try {
    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    const payloadSegment = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const paddedSegment = payloadSegment.padEnd(Math.ceil(payloadSegment.length / 4) * 4, '=');
    const decoded = Buffer.from(paddedSegment, 'base64').toString('utf-8');
    const payload = JSON.parse(decoded);

    if (payload && typeof payload === 'object') {
      return payload.sub ?? payload.user_id ?? null;
    }
  } catch (error) {
    console.error('Falha ao decodificar JWT do Supabase:', error);
  }

  return null;
}
