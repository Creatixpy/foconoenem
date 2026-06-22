'use client';

import { useSyncExternalStore } from 'react';
import { Megaphone, X } from 'lucide-react';

const STORAGE_KEY = 'aprovia_rebranding_v1_dismissed';
const CHANGE_EVENT = 'aprovia-rebranding-change';

function subscribe(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener(CHANGE_EVENT, callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}

function getServerSnapshot() {
  return false;
}

export default function RebrandingBanner() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  if (!visible) {
    return null;
  }

  return (
    <aside className="border-b border-[var(--brand)]/25 bg-[var(--brand-soft)] text-[var(--text)]" aria-label="Aviso de nova marca">
      <div className="container flex min-h-11 items-center justify-center gap-3 py-2 pl-4 pr-1 text-sm sm:pr-4">
        <Megaphone className="h-4 w-4 shrink-0 text-[var(--ai)]" aria-hidden="true" />
        <p className="text-center text-sm font-medium text-[var(--text-2)]">
          <strong className="text-[var(--text)]">Foco no ENEM agora é AprovIA.</strong>{' '}
          A mesma plataforma, com uma identidade mais inteligente.
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--text-3)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          aria-label="Dispensar aviso"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
