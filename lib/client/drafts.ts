export type DraftKind = 'essay' | 'quiz';
export type DraftStatus = 'empty' | 'restored' | 'saved' | 'invalid' | 'unavailable' | 'stopped';
type DraftSchema<T> = { safeParse: (value: unknown) => { success: true; data: T } | { success: false } };
type StorageProvider = (kind: DraftKind) => Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const activeStores = new Set<{ userId: string; stop: () => void }>();
const PREFIX = 'aprovia:draft:v1';
const LOGOUT_PREFIX = 'aprovia:draft:logout:';
let listening = false;

function browserStorage(kind: DraftKind) {
  return kind === 'essay' ? window.localStorage : window.sessionStorage;
}

export function draftKey(kind: DraftKind, userId: string) {
  return `${PREFIX}:${kind}:${userId}`;
}

function logoutVersion(userId: string, storage: StorageProvider): string | null {
  try { return storage('essay').getItem(`${LOGOUT_PREFIX}${userId}`); } catch { return null; }
}

function stopUserStores(userId: string) {
  for (const store of activeStores) {
    if (store.userId === userId) store.stop();
  }
}

function removeUserDrafts(userId: string, storage: StorageProvider) {
  for (const kind of ['essay', 'quiz'] as const) {
    try { storage(kind).removeItem(draftKey(kind, userId)); } catch { /* Storage may be disabled. */ }
  }
}

function listenForExplicitLogout() {
  if (typeof window === 'undefined' || listening) return;
  listening = true;
  window.addEventListener('storage', (event) => {
    if (!event.key?.startsWith(LOGOUT_PREFIX) || !event.newValue) return;
    const userId = event.key.slice(LOGOUT_PREFIX.length);
    stopUserStores(userId);
    removeUserDrafts(userId, browserStorage);
  });
}
// The header imports this module too, including tabs currently outside a workflow.
listenForExplicitLogout();

// Automatic session expiry never calls this function.
export function clearUserDrafts(userId: string, storage: StorageProvider = browserStorage) {
  stopUserStores(userId);
  removeUserDrafts(userId, storage);
  try { storage('essay').setItem(`${LOGOUT_PREFIX}${userId}`, crypto.randomUUID()); } catch { /* In-memory stores are still stopped. */ }
}

export function createDraftStore<T>(kind: DraftKind, userId: string, schema: DraftSchema<T>, storage: StorageProvider = browserStorage) {
  let stopped = false;
  let savedAt: number | null = null;
  const versionAtOpen = logoutVersion(userId, storage);
  const registration = { userId, stop: () => { stopped = true; } };
  activeStores.add(registration);
  listenForExplicitLogout();
  const key = draftKey(kind, userId);
  return {
    get savedAt() { return savedAt; },
    read(): { value: T | null; status: DraftStatus; savedAt: number | null } {
      savedAt = null;
      if (stopped) return { value: null, status: 'stopped', savedAt };
      try {
        const raw = storage(kind).getItem(key);
        if (!raw) return { value: null, status: 'empty', savedAt };
        try {
          const envelope: unknown = JSON.parse(raw);
          if (envelope && typeof envelope === 'object' && 'version' in envelope && envelope.version === 1 &&
            'userId' in envelope && envelope.userId === userId && 'logoutVersion' in envelope && 'value' in envelope) {
            // Also handles a logout missed while this tab was suspended or unloaded.
            if (envelope.logoutVersion !== logoutVersion(userId, storage)) {
              storage(kind).removeItem(key);
              return { value: null, status: 'empty', savedAt };
            }
            // v1 drafts written before timestamps remain readable.
            if ('savedAt' in envelope && (typeof envelope.savedAt !== 'number' ||
              !Number.isSafeInteger(envelope.savedAt) || envelope.savedAt <= 0 ||
              envelope.savedAt > 8_640_000_000_000_000)) {
              return { value: null, status: 'invalid', savedAt };
            }
            const parsed = schema.safeParse(envelope.value);
            if (parsed.success) {
              savedAt = 'savedAt' in envelope ? envelope.savedAt as number : null;
              return { value: parsed.data, status: 'restored', savedAt };
            }
          }
        } catch { /* Invalid JSON is never restored. */ }
        return { value: null, status: 'invalid', savedAt };
      } catch {
        return { value: null, status: 'unavailable', savedAt };
      }
    },
    write(value: T): DraftStatus {
      if (stopped || versionAtOpen !== logoutVersion(userId, storage)) return 'stopped';
      if (!schema.safeParse(value).success) return 'unavailable';
      try {
        const timestamp = Date.now();
        storage(kind).setItem(key, JSON.stringify({ version: 1, userId, logoutVersion: versionAtOpen, value, savedAt: timestamp }));
        savedAt = timestamp;
        return 'saved';
      } catch {
        return 'unavailable';
      }
    },
    clear(): DraftStatus {
      if (stopped) return 'stopped';
      try { storage(kind).removeItem(key); savedAt = null; return 'empty'; } catch { return 'unavailable'; }
    },
    dispose() {
      stopped = true;
      activeStores.delete(registration);
    },
  };
}
