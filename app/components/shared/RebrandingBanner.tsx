'use client';

import { useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { Megaphone, X } from 'lucide-react';
import { CANONICAL_SITE_ORIGIN, LEGACY_SITE_HOST } from '@/lib/constants/site';
import { isLegacySessionPath } from '@/lib/client/workspace-navigation';
import {
  createLegacyHostNotice,
  createRebrandingNotice,
  LEGACY_HOST_DISMISSAL_KEY,
  REBRANDING_DISMISSAL_KEY,
  REBRANDING_EXPIRES_AT,
} from '@/lib/client/rebranding-notice';

const CHANGE_EVENT = 'aprovia-rebranding-change';
const REBRANDING_VISIBLE = 1;
const LEGACY_NOTICE_VISIBLE = 2;
const LEGACY_HOST = 4;
const rebrandingNotice = createRebrandingNotice(() => window.localStorage);
const legacyHostNotice = createLegacyHostNotice(() => window.sessionStorage);

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === REBRANDING_DISMISSAL_KEY || event.key === LEGACY_HOST_DISMISSAL_KEY) callback();
  };
  let expiryTimer: number | undefined;
  const scheduleExpiry = () => {
    const delay = REBRANDING_EXPIRES_AT - Date.now();
    if (delay <= 0) return;
    expiryTimer = window.setTimeout(() => {
      callback();
      scheduleExpiry();
    }, Math.min(delay, 2_147_483_647));
  };
  scheduleExpiry();
  window.addEventListener('storage', onStorage);
  window.addEventListener(CHANGE_EVENT, callback);
  document.addEventListener('visibilitychange', callback);

  return () => {
    window.clearTimeout(expiryTimer);
    window.removeEventListener('storage', onStorage);
    window.removeEventListener(CHANGE_EVENT, callback);
    document.removeEventListener('visibilitychange', callback);
  };
}

function getSnapshot() {
  const rebranding = rebrandingNotice.isVisible() ? REBRANDING_VISIBLE : 0;
  const isLegacyHost = window.location.hostname === LEGACY_SITE_HOST;
  const legacyNotice = isLegacyHost && legacyHostNotice.isVisible() ? LEGACY_NOTICE_VISIBLE : 0;
  return rebranding + legacyNotice + (isLegacyHost ? LEGACY_HOST : 0);
}

function getServerSnapshot() {
  return 0;
}

export default function RebrandingBanner() {
  const pathname = usePathname();
  const noticeState = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const isLegacyWorkspace = Boolean(noticeState & LEGACY_HOST) && isLegacySessionPath(pathname);
  const showLegacyHostNotice = isLegacyWorkspace && Boolean(noticeState & LEGACY_NOTICE_VISIBLE);
  const showRebranding = !isLegacyWorkspace && Boolean(noticeState & REBRANDING_VISIBLE);

  const dismiss = () => {
    if (showLegacyHostNotice) legacyHostNotice.dismiss();
    else rebrandingNotice.dismiss();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  if (!showLegacyHostNotice && !showRebranding) {
    return null;
  }

  return (
    <aside className="border-b border-[var(--brand)]/25 bg-[var(--brand-soft)] text-[var(--text)]" aria-label={showLegacyHostNotice ? 'Aviso de novo endereço' : 'Aviso de nova marca'}>
      <div className="container flex min-h-12 items-center justify-center gap-3 py-2 pl-4 pr-1 text-sm sm:pr-4">
        <Megaphone className="h-4 w-4 shrink-0 text-[var(--ai)]" aria-hidden="true" />
        <p className="text-center text-sm font-medium text-[var(--text-2)]">
          {showLegacyHostNotice ? <>
            <strong className="text-[var(--text)]">AprovIA tem um novo endereço.</strong>{' '}
            Seus rascunhos ficam neste navegador e endereço. Recupere e copie seu trabalho antes de mudar.{' '}
            <a href={CANONICAL_SITE_ORIGIN} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center rounded-lg px-2 font-semibold text-[var(--text)] underline decoration-[var(--brand-hover)] underline-offset-4">Abrir o novo endereço<span className="sr-only"> em outra aba</span></a>
          </> : <>
            <strong className="text-[var(--text)]">Foco no ENEM agora é AprovIA.</strong>{' '}
            A mesma plataforma, com uma identidade mais inteligente.
          </>}
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          aria-label="Dispensar aviso"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
