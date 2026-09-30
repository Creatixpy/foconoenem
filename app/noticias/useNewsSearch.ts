'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useRetryDelay } from '@/lib/client/use-retry-delay';
import { useBuscaIA, useBuscaNoticias } from './hooks';

export function useNewsSearch() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const urlQuery = (params.get('q') ?? '').trim();
  const urlIsAI = params.get('modo') === 'ia';
  const urlKey = JSON.stringify([urlQuery, urlIsAI]);
  const [form, setForm] = useState({ urlKey, query: urlQuery, isAI: urlIsAI });
  // Reset editable fields when history changes, before rendering the form.
  if (form.urlKey !== urlKey) setForm({ urlKey, query: urlQuery, isAI: urlIsAI });
  const { query, isAI } = form;
  const setQuery = (value: string) => setForm((current) => ({ ...current, query: value }));
  const setIsAI = (value: boolean) => setForm((current) => ({ ...current, isAI: value }));
  const archive = useBuscaNoticias();
  const ai = useBuscaIA();
  const { search, clear } = archive;
  const { search: aiSearch, clear: clearAI } = ai;
  const secondsToRetry = useRetryDelay(urlIsAI ? ai.retryAt : archive.retryAt);

  const run = useCallback((q: string, withAI: boolean) => {
    if (withAI) { clear(); void aiSearch(q); }
    else { clearAI(); void search(q); }
  }, [search, clear, aiSearch, clearAI]);
  useEffect(() => {
    if (urlQuery) run(urlQuery, urlIsAI);
    else { clear(); clearAI(); }
    return () => { clear(); clearAI(); };
  }, [urlQuery, urlIsAI, run, clear, clearAI]);

  const submit = (q = query, withAI = isAI) => {
    const term = q.trim();
    if (!term || secondsToRetry) return;
    setQuery(term);
    setIsAI(withAI);
    if (term === urlQuery && withAI === urlIsAI) { run(term, withAI); return; }
    // Cancel immediately, before the navigation commits and starts the new search.
    clear();
    clearAI();
    const next = new URLSearchParams(params.toString());
    next.set('q', term);
    if (withAI) next.set('modo', 'ia');
    else next.delete('modo');
    router.push(`${pathname}?${next}`, { scroll: false });
  };
  const clearResults = () => {
    clear();
    clearAI();
    setQuery('');
    setIsAI(false);
    const next = new URLSearchParams(params.toString());
    next.delete('q');
    next.delete('modo');
    router.push(`${pathname}${next.size ? `?${next}` : ''}`, { scroll: false });
  };
  const active = urlIsAI ? ai : archive;
  return {
    query, setQuery, isAI, setIsAI, submit, clearResults, secondsToRetry,
    showingSearch: !!urlQuery && !urlIsAI, showingAI: !!urlQuery && urlIsAI,
    loading: active.loading, error: active.error, searched: active.searched,
    results: archive.results, aiContent: ai.content,
  };
}
