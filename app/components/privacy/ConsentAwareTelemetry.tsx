'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

type CookiePreferences = {
  version: 1;
  necessary: true;
  analytics: boolean;
  updatedAt: string;
};

const STORAGE_KEY = 'fne.cookie-preferences.v1';
const NO_CONSENT_SNAPSHOT = JSON.stringify({
  ready: true,
  preferences: null,
} satisfies ConsentSnapshot);

function buildPreferences(analytics: boolean): CookiePreferences {
  return {
    version: 1,
    necessary: true,
    analytics,
    updatedAt: new Date().toISOString(),
  };
}

function readPreferences(): CookiePreferences | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed = JSON.parse(stored) as Partial<CookiePreferences>;
    if (parsed.version !== 1 || parsed.necessary !== true || typeof parsed.analytics !== 'boolean') {
      return null;
    }

    return {
      version: 1,
      necessary: true,
      analytics: parsed.analytics,
      updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    };
  } catch {
    return null;
  }
}

function persistPreferences(preferences: CookiePreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    return true;
  } catch {
    return false;
  }
}

type ConsentSnapshot = {
  ready: boolean;
  preferences: CookiePreferences | null;
};

function getConsentSnapshot(): string {
  if (typeof window === 'undefined') {
    return NO_CONSENT_SNAPSHOT;
  }

  return JSON.stringify({ ready: true, preferences: readPreferences() } satisfies ConsentSnapshot);
}

function getServerConsentSnapshot(): string {
  return NO_CONSENT_SNAPSHOT;
}

function subscribeToConsentChanges(callback: () => void) {
  const notify = () => callback();

  window.addEventListener('storage', notify);
  window.addEventListener('fne:cookie-consent-updated', notify);

  return () => {
    window.removeEventListener('storage', notify);
    window.removeEventListener('fne:cookie-consent-updated', notify);
  };
}

type ConsentAwareTelemetryProps = {
  enabled: boolean;
};

export default function ConsentAwareTelemetry({ enabled }: ConsentAwareTelemetryProps) {
  const snapshot = useSyncExternalStore(
    subscribeToConsentChanges,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const { ready, preferences } = JSON.parse(snapshot) as ConsentSnapshot;
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [analyticsDraft, setAnalyticsDraft] = useState(false);
  const [fallbackPreferences, setFallbackPreferences] = useState<CookiePreferences | null>(null);
  const effectivePreferences = preferences ?? fallbackPreferences;

  useEffect(() => {
    const openPreferences = () => {
      const current = readPreferences() ?? fallbackPreferences;
      setAnalyticsDraft(current?.analytics ?? false);
      setIsPanelOpen(true);
    };

    window.addEventListener('fne:open-cookie-preferences', openPreferences);
    return () => window.removeEventListener('fne:open-cookie-preferences', openPreferences);
  }, [fallbackPreferences]);

  function savePreferences(analytics: boolean) {
    const nextPreferences = buildPreferences(analytics);
    const persisted = persistPreferences(nextPreferences);
    setFallbackPreferences(persisted ? null : nextPreferences);
    window.dispatchEvent(new Event('fne:cookie-consent-updated'));
    setAnalyticsDraft(analytics);
    setIsPanelOpen(false);
  }

  const analyticsAllowed = enabled && effectivePreferences?.analytics === true;
  const shouldShowPanel = ready && (!effectivePreferences || isPanelOpen);

  return (
    <>
      {analyticsAllowed && (
        <>
          <SpeedInsights debug={false} />
          <Analytics debug={false} mode="production" />
        </>
      )}

      {shouldShowPanel && (
        <div
          className="fixed inset-x-0 bottom-3 z-50 px-3 sm:bottom-5 sm:px-5"
          role="region"
          aria-labelledby="cookie-consent-title"
        >
          <div className="mx-auto w-full max-w-5xl overflow-hidden rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_24px_70px_rgba(15,23,42,0.24)] ring-1 ring-white/5 backdrop-blur-md">
            <div className="h-1 bg-[linear-gradient(90deg,var(--primary),#22C55E,#F59E0B)]" />

            <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div className="flex gap-3">
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-light)] text-[var(--primary)]"
                >
                  <span className="h-3 w-5 -rotate-45 border-b-2 border-l-2 border-current" />
                </span>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 id="cookie-consent-title" className="text-base font-semibold text-[var(--text-primary)]">
                      Preferências de cookies
                    </h2>
                    <span className="rounded-full border border-[var(--primary)]/20 bg-[var(--primary-light)] px-2.5 py-1 text-xs font-medium text-[var(--primary)]">
                      Essenciais ativos
                    </span>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
                    Usamos cookies de sessão e segurança. Métricas opcionais só carregam se você permitir.
                  </p>
                  <Link
                    href="/privacidade"
                    className="mt-2 inline-flex text-sm font-medium text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]"
                  >
                    Ver Política de Privacidade
                  </Link>
                </div>
              </div>

              <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)]/80 p-3">
                <label className="flex cursor-pointer items-center justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[var(--text-primary)]">Métricas opcionais</span>
                    <span className="mt-1 block text-xs leading-relaxed text-[var(--text-muted)]">
                      Vercel Analytics e Speed Insights
                    </span>
                  </span>
                  <input
                    type="checkbox"
                    className="peer sr-only"
                    checked={analyticsDraft}
                    onChange={(event) => setAnalyticsDraft(event.target.checked)}
                  />
                  <span className="relative inline-flex h-6 w-11 shrink-0 rounded-full bg-[var(--border-color-strong)] transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-transform peer-checked:bg-[var(--primary)] peer-checked:after:translate-x-5 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--primary)]" />
                </label>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3 lg:grid-cols-1">
                  <button
                    type="button"
                    className="rounded-lg bg-[var(--primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--primary-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    onClick={() => savePreferences(true)}
                  >
                    Aceitar métricas
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--muted-bg)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    onClick={() => savePreferences(analyticsDraft)}
                  >
                    Salvar escolha
                  </button>
                  <button
                    type="button"
                    className="rounded-lg px-4 py-2.5 text-sm font-semibold text-[var(--text-secondary)] transition-colors hover:bg-[var(--muted-bg)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                    onClick={() => savePreferences(false)}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
