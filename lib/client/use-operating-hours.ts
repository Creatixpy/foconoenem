'use client';

import { useEffect, useState } from 'react';
import { calculateOperatingHours, type OperatingHoursInfo } from '@/lib/contracts/operating-hours';

export function useOperatingHours(initial: OperatingHoursInfo) {
  const [info, setInfo] = useState(initial);
  useEffect(() => {
    const update = () => setInfo(calculateOperatingHours(new Date()));
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
  return info;
}
