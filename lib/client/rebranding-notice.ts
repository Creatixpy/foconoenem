export const REBRANDING_DISMISSAL_KEY = 'aprovia_rebranding_v1_dismissed';
export const REBRANDING_EXPIRES_AT = Date.parse('2026-10-30T23:59:59-03:00');
export const LEGACY_HOST_DISMISSAL_KEY = 'aprovia_legacy_host_v1_dismissed';

type NoticeStorage = Pick<Storage, 'getItem' | 'setItem'>;

function createNotice(storage: () => NoticeStorage, key: string, expiresAt: number) {
  let dismissedInMemory = false;
  return {
    isVisible(now = Date.now()) {
      if (dismissedInMemory || now >= expiresAt) return false;
      try { return storage().getItem(key) !== 'true'; }
      catch { return true; }
    },
    dismiss() {
      dismissedInMemory = true;
      try { storage().setItem(key, 'true'); }
      catch { /* Dismissal still works in this page when storage is unavailable. */ }
    },
  };
}

export function createRebrandingNotice(storage: () => NoticeStorage) {
  return createNotice(storage, REBRANDING_DISMISSAL_KEY, REBRANDING_EXPIRES_AT);
}

export function createLegacyHostNotice(storage: () => NoticeStorage) {
  return createNotice(storage, LEGACY_HOST_DISMISSAL_KEY, Infinity);
}
