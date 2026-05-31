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
  } catch {
    // If storage is unavailable, keep the in-memory choice for this page load.
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

  useEffect(() => {
    const openPreferences = () => {
      const current = readPreferences();
      setAnalyticsDraft(current?.analytics ?? false);
      setIsPanelOpen(true);
    };

    window.addEventListener('fne:open-cookie-preferences', openPreferences);
    return () => window.removeEventListener('fne:open-cookie-preferences', openPreferences);
  }, []);

  function savePreferences(analytics: boolean) {
    const nextPreferences = buildPreferences(analytics);
    persistPreferences(nextPreferences);
    window.dispatchEvent(new Event('fne:cookie-consent-updated'));
    setAnalyticsDraft(analytics);
    setIsPanelOpen(false);
  }

  const analyticsAllowed = enabled && preferences?.analytics === true;
  const shouldShowPanel = ready && (!preferences || isPanelOpen);

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
          className="fixed inset-x-0 bottom-0 z-50 border-t border-border-color bg-bg-base/95 px-4 py-4 shadow-2xl backdrop-blur-md"
          role="region"
          aria-labelledby="cookie-consent-title"
        >
          <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="max-w-3xl">
              <h2 id="cookie-consent-title" className="text-base font-semibold text-text-primary">
                Preferências de cookies
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Usamos cookies essenciais para login, segurança e funcionamento da sessão. Métricas opcionais de
                navegação ajudam a entender estabilidade e uso do site, mas só serão carregadas se você permitir.
              </p>
              <Link href="/privacidade" className="mt-2 inline-block text-sm font-medium text-primary hover:text-primary-hover">
                Ver Política de Privacidade
              </Link>
            </div>

            <div className="flex w-full flex-col gap-3 md:w-[320px]">
              <div className="rounded-lg border border-border-color bg-card-bg p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-text-primary">Cookies essenciais</p>
                    <p className="mt-1 text-xs leading-relaxed text-text-muted">Sempre ativos para autenticação e segurança.</p>
                  </div>
                  <span className="rounded-full bg-primary-light px-2 py-1 text-xs font-medium text-primary">Ativo</span>
                </div>
              </div>

              <label className="flex cursor-pointer items-start justify-between gap-4 rounded-lg border border-border-color bg-card-bg p-3">
                <span>
                  <span className="block text-sm font-medium text-text-primary">Métricas opcionais</span>
                  <span className="mt-1 block text-xs leading-relaxed text-text-muted">Vercel Analytics e Speed Insights.</span>
                </span>
                <input
                  type="checkbox"
                  className="mt-1 h-5 w-5 accent-primary"
                  checked={analyticsDraft}
                  onChange={(event) => setAnalyticsDraft(event.target.checked)}
                />
              </label>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 md:grid-cols-1">
                <button
                  type="button"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
                  onClick={() => savePreferences(true)}
                >
                  Aceitar métricas
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border-color px-4 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-muted-bg"
                  onClick={() => savePreferences(analyticsDraft)}
                >
                  Salvar escolha
                </button>
                <button
                  type="button"
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-text-secondary transition-colors hover:bg-muted-bg hover:text-text-primary"
                  onClick={() => savePreferences(false)}
                >
                  Recusar métricas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
