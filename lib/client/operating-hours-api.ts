import type { OperatingHoursAccess } from '@/lib/contracts/operating-hours';

export function parseOperatingHoursAccess(payload: unknown, userId: string): OperatingHoursAccess | undefined {
  if (!payload || typeof payload !== 'object' || !('authenticated' in payload)) {
    throw new Error('Resposta de assinatura inválida.');
  }
  if (payload.authenticated === false) return undefined;
  if (payload.authenticated !== true || !('userId' in payload)) {
    throw new Error('Resposta de assinatura inválida.');
  }
  if (payload.userId !== userId) return undefined;
  if (!('subscription' in payload) || !payload.subscription || typeof payload.subscription !== 'object') {
    throw new Error('Resposta de assinatura inválida.');
  }
  const subscription = payload.subscription;
  if (!('hasMaxAccess' in subscription) || typeof subscription.hasMaxAccess !== 'boolean') {
    throw new Error('Resposta de assinatura inválida.');
  }
  if (!subscription.hasMaxAccess) return undefined;
  if (!('planCode' in subscription) || subscription.planCode !== 'max' ||
      !('currentPeriodEnd' in subscription) || typeof subscription.currentPeriodEnd !== 'string' ||
      !Number.isFinite(Date.parse(subscription.currentPeriodEnd))) {
    throw new Error('Validade da assinatura inválida.');
  }
  return { userId, expiresAt: subscription.currentPeriodEnd };
}

export async function fetchOperatingHoursAccess(userId: string, signal: AbortSignal) {
  const timeout = new AbortController();
  const timer = window.setTimeout(() => timeout.abort(), 20_000);
  try {
    const response = await fetch('/api/assinatura/status', {
      credentials: 'same-origin', cache: 'no-store',
      signal: AbortSignal.any([signal, timeout.signal]),
    });
    if (!response.ok) throw new Error('Assinatura temporariamente indisponível.');
    return parseOperatingHoursAccess(await response.json(), userId);
  } finally {
    window.clearTimeout(timer);
  }
}
