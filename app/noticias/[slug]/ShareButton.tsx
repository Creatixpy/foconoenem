'use client';

import { useEffect, useRef, useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);
  const [manualUrl, setManualUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);
  useEffect(() => { if (manualUrl) { inputRef.current?.focus(); inputRef.current?.select(); } }, [manualUrl]);

  const handleShare = async () => {
    setBusy(true);
    setCopied(false);
    setManualUrl('');
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 2_000);
    } catch {
      setManualUrl(window.location.href);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="min-w-0 space-y-2">
      <button type="button" disabled={busy} onClick={() => void handleShare()} className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] px-3 py-3 text-xs text-[var(--text-2)] hover:border-[var(--border-hover)] disabled:opacity-50">
        {copied ? 'Link copiado' : busy ? 'Copiando…' : 'Copiar link'}
      </button>
      {copied && <span className="sr-only" role="status">Link copiado.</span>}
      {manualUrl && <div className="space-y-2">
        <p role="status" className="text-sm text-[var(--text-2)]">Não foi possível copiar automaticamente. Selecione e copie o link abaixo.</p>
        <label htmlFor="manual-news-link" className="sr-only">Link para copiar</label>
        <input ref={inputRef} id="manual-news-link" readOnly value={manualUrl} onFocus={(event) => event.target.select()} className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-3 text-base text-[var(--text)]" />
      </div>}
    </div>
  );
}
