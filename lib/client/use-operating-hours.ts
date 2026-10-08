'use client';

import { useEffect, useState } from 'react';
import { operatingHoursForUser, type OperatingHoursAccess, type OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import { fetchOperatingHoursAccess } from './operating-hours-api';

export function useOperatingHours(initial: OperatingHoursInfo, userId?: string) {
  const [now, setNow] = useState<Date | null>(null);
  const initialExpiry = initial.unrestrictedAccess?.expiresAt;
  const [verifiedAccess, setVerifiedAccess] = useState<{ userId: string; initialExpiry?: string; access?: OperatingHoursAccess } | null>(null);
  useEffect(() => {
    const update = () => setNow(new Date());
    const onVisible = () => { if (document.visibilityState === 'visible') update(); };
    update();
    const interval = window.setInterval(update, 60_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', update);
    };
  }, []);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    let inFlight = false;
    const refresh = async () => {
      if (inFlight || document.visibilityState === 'hidden') return;
      inFlight = true;
      try {
        const access = await fetchOperatingHoursAccess(userId, controller.signal);
        if (!controller.signal.aborted) setVerifiedAccess({ userId, initialExpiry, access });
      } catch {
        // Keep the last verified hint until its expiry; the server authorizes every request.
      } finally {
        inFlight = false;
      }
    };
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    const interval = window.setInterval(() => void refresh(), 60_000);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [userId, initialExpiry]);
  const current = verifiedAccess && verifiedAccess.userId === userId && verifiedAccess.initialExpiry === initialExpiry
    ? { ...initial, unrestrictedAccess: verifiedAccess.access }
    : initial;
  if (now) return operatingHoursForUser(current, userId, now);
  if (initial.unrestrictedAccess && initial.unrestrictedAccess.userId !== userId) {
    return { ...initial, isOpen: false, unrestrictedAccess: undefined, message: 'Verificando disponibilidade…' };
  }
  return current;
}
