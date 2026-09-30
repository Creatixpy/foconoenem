'use client';

import { useEffect, useState } from 'react';

export function useRetryDelay(retryAt: number | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!retryAt) return;
    const update = () => setNow(Date.now());
    update();
    const interval = window.setInterval(update, 1_000);
    window.addEventListener('focus', update);
    return () => { window.clearInterval(interval); window.removeEventListener('focus', update); };
  }, [retryAt]);
  return retryAt ? Math.max(0, Math.ceil((retryAt - now) / 1_000)) : 0;
}
