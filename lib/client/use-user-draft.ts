'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createDraftStore, type DraftKind, type DraftStatus } from './drafts';

// Callers are keyed by user ID, so no previous user's state is ever rendered.
export function useUserDraft<T>(
  kind: DraftKind,
  userId: string,
  schema: Parameters<typeof createDraftStore<T>>[2],
  initial: T,
) {
  const [draft, setDraft] = useState(initial);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState<DraftStatus>('empty');
  const currentRef = useRef(initial);
  const storeRef = useRef<ReturnType<typeof createDraftStore<T>> | null>(null);

  useEffect(() => {
    const store = createDraftStore(kind, userId, schema);
    storeRef.current = store;
    const restored = store.read();
    currentRef.current = restored.value ?? initial;
    setDraft(currentRef.current);
    setStatus(restored.status);
    setReady(true);
    return () => { store.dispose(); storeRef.current = null; };
  }, [kind, userId, schema, initial]);

  const updateDraft = useCallback((update: T | ((current: T) => T)) => {
    if (!storeRef.current) return;
    const next = typeof update === 'function' ? (update as (current: T) => T)(currentRef.current) : update;
    currentRef.current = next;
    setDraft(next);
    // Save before starting network work, including the IDs and frozen submission.
    setStatus(storeRef.current.write(next));
  }, []);

  const clearDraft = useCallback(() => {
    currentRef.current = initial;
    setDraft(initial);
    setStatus(storeRef.current?.clear() ?? 'unavailable');
  }, [initial]);

  return { draft, updateDraft, clearDraft, ready, status };
}
