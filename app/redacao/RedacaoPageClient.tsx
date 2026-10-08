'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useOperatingHours } from '@/lib/client/use-operating-hours';
import FlowStatus from '@/app/components/shared/FlowStatus';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import dynamic from 'next/dynamic';
import ThemeSection from './_components/ThemeSection';
import RequirementsChecklist from './_components/RequirementsChecklist';
import { ClockIcon, SendIcon, SpinnerIcon } from './_components/icons';
import styles from './redacao.module.css';
import { essayDraftMessage, essaySubmitLabel, essaySubmitReason, essayWordCountMessage, hasMeaningfulEssayDraft, wordCountState } from './essay-presentation';
import {
  MAX_WORDS,
  MIN_WORDS,
  MAX_ESSAY_CHARACTERS,
  useEssayWorkflow,
} from './useEssayWorkflow';

const PhotoUpload = dynamic(() => import('./PhotoUpload'), {
  loading: () => <div className="border-b border-[var(--border)] px-5 py-3"><FlowStatus>Preparando envio de foto…</FlowStatus></div>,
});

function OperatingHoursPill({ info }: { info: OperatingHoursInfo | null }) {
  if (!info) return null;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium
        ${info.isOpen
          ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
          : 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
        }
      `}
    >
      <ClockIcon />
      {info.isOpen ? `Correção disponível até ${info.closesAt} · Brasília` : `Correção abre ${info.nextOpenTime} · Brasília`}
    </span>
  );
}

function EssayWorkflow({ userId, initialHours }: { userId: string; initialHours: OperatingHoursInfo }) {
  const operatingHours = useOperatingHours(initialHours);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const discardConfirmationRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const [discardRequested, setDiscardRequested] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const [editing, setEditing] = useState(false);
  const workflow = useEssayWorkflow(userId);
  const { themeMode, setThemeMode, theme, themeLoading, themeError, manualTheme, setManualTheme,
    essay, setEssay, correcting, correctionError, wordCount, charCount, hasSelectedTheme,
    canSubmit, generateTheme, submitEssay, ready, draftStatus, savedAt, discardDraft,
    themeValidation, inputValidation, secondsToRetry, themeSecondsToRetry } = workflow;
  const meaningful = hasMeaningfulEssayDraft(workflow);
  const reason = essaySubmitReason({ correcting, themeLoading, secondsToRetry, isOpen: operatingHours.isOpen,
    hasTheme: hasSelectedTheme, themeValidation, words: wordCount, characters: charCount });
  const submitUnavailable = !canSubmit || !operatingHours.isOpen;
  const submitLabel = essaySubmitLabel({ correcting, themeLoading, secondsToRetry, isOpen: operatingHours.isOpen,
    hasTheme: hasSelectedTheme, themeMode, manualTheme, words: wordCount, characters: charCount });
  const wordsState = wordCountState(wordCount);
  const countColor = wordsState === 'violated' ? 'var(--danger)' : wordsState === 'near-limit' ? 'var(--warning)' : wordsState === 'met' ? 'var(--success)' : 'var(--text-3)';
  const countMessage = essayWordCountMessage(wordCount);
  const draftMessage = essayDraftMessage({ status: draftStatus, meaningful, essay, savedAt });
  const [announcements, setAnnouncements] = useState({ count: '', draft: '' });
  useEffect(() => {
    const timer = window.setTimeout(() => setAnnouncements({ count: countMessage, draft: draftMessage }), 600);
    return () => window.clearTimeout(timer);
  }, [countMessage, draftMessage]);
  useEffect(() => { if (discardRequested) discardConfirmationRef.current?.focus(); }, [discardRequested]);
  useEffect(() => {
    if (!meaningful || (draftStatus !== 'unavailable' && draftStatus !== 'stopped')) return;
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [meaningful, draftStatus]);

  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-10"><FlowStatus>Recuperando seu rascunho…</FlowStatus></div>;

  return <div className={`student-flow mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10 ${styles.workflow} ${editing ? styles.editing : ''}`}
    onFocusCapture={(event) => {
      if ((event.target instanceof HTMLTextAreaElement || event.target instanceof HTMLInputElement) && event.target.type !== 'file') setEditing(true);
      // Do not move the bar between pointer-down and click on editing actions.
      else if (!(event.target instanceof HTMLButtonElement) && !actionsRef.current?.contains(event.target as Node)) setEditing(false);
    }}
    onBlurCapture={(event) => {
      // Keep the actions in place when focus moves from a field to its button.
      if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget as Node)) setEditing(false);
      else if (!event.relatedTarget) {
        const container = event.currentTarget;
        window.requestAnimationFrame(() => {
          const active = document.activeElement;
          if (active === document.body || !container.contains(active)) setEditing(false);
        });
      }
    }}>
    <header className="mb-7">
      <OperatingHoursPill info={operatingHours} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">Escreva sua redação</h1>
        <Link href="/conta?aba=redacoes" className="inline-flex min-h-12 items-center rounded-lg px-3 text-sm font-medium text-[var(--brand-hover)] underline underline-offset-4">Minhas redações</Link>
      </div>
      <p className="mt-2 max-w-2xl text-sm text-[var(--text-2)]">Escolha um tema, escreva ou transcreva sua redação e receba uma correção por competência.</p>
    </header>

    {(draftMessage || meaningful) && <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-2)]">{draftMessage}</p>
      {meaningful && <button ref={discardButtonRef} type="button" disabled={correcting} onClick={() => setDiscardRequested(true)} className="min-h-12 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-2)] disabled:cursor-not-allowed">{essay.trim() ? 'Descartar rascunho' : 'Descartar tema'}</button>}
    </div>}
    <p className="sr-only" role="status" aria-live="polite">{announcements.draft}</p>
    {discardRequested && <div ref={discardConfirmationRef} tabIndex={-1} className="mb-5 rounded-xl border border-[var(--warning)]/40 p-4" role="group" aria-label="Confirmar descarte do rascunho">
      <p className="text-sm text-[var(--text-2)]">Descartar o texto e o tema salvos neste navegador?</p>
      <div className="mt-3 flex flex-wrap gap-3">
        <button type="button" disabled={correcting} onClick={() => { discardDraft(); setDiscardRequested(false); setPhotoVersion((value) => value + 1); window.requestAnimationFrame(() => document.getElementById('essay-theme-title')?.focus()); }} className="min-h-12 rounded-lg bg-[var(--brand)] px-4 py-3 text-sm text-white">Descartar rascunho</button>
        <button type="button" onClick={() => { setDiscardRequested(false); discardButtonRef.current?.focus(); }} className="min-h-12 rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">Cancelar</button>
      </div>
    </div>}

    <div className={styles.steps}>
      <section className={styles.theme}>
        <ThemeSection disabled={correcting} canGenerate={operatingHours.isOpen && themeSecondsToRetry === 0}
          secondsToRetry={themeSecondsToRetry} validation={themeValidation} mode={themeMode} theme={theme}
          themeLoading={themeLoading} themeError={themeError} manualTheme={manualTheme}
          onModeChange={setThemeMode} onManualThemeChange={setManualTheme}
          onGenerate={() => { void generateTheme().then((generated) => { if (generated) window.requestAnimationFrame(() => editorRef.current?.focus()); }); }} />
      </section>

      <section className={styles.editor} aria-labelledby="essay-write-title">
        <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
          <h2 id="essay-write-title" className="border-b border-[var(--border)] px-5 py-4 text-base font-semibold text-[var(--text)]"><label htmlFor="essay-text">2. Sua redação</label></h2>
          {!hasSelectedTheme && <p id="essay-theme-hint" className="px-5 pt-4 text-sm text-[var(--text-2)]">Você pode escrever agora. Escolha um tema antes de enviar para correção.</p>}
          <PhotoUpload key={photoVersion} currentText={essay} onTextExtracted={(text) => { setEssay(text); window.requestAnimationFrame(() => editorRef.current?.focus()); }} disabled={correcting} />
          <textarea ref={editorRef} id="essay-text" aria-label="Sua redação"
            aria-describedby={`essay-counter essay-validation${!hasSelectedTheme ? ' essay-theme-hint' : ''}`}
            aria-invalid={wordCount > MAX_WORDS || charCount > MAX_ESSAY_CHARACTERS}
            value={essay} onChange={(event) => setEssay(event.target.value)} placeholder="Comece sua redação aqui…" disabled={correcting}
            className="min-h-[400px] w-full resize-y bg-transparent p-5 font-[var(--font-inter)] text-base leading-[1.8] text-[var(--text)] placeholder:text-[var(--text-3)] disabled:cursor-not-allowed sm:min-h-[500px] sm:p-6" />
          <p id="essay-validation" className={`px-5 pb-3 text-sm ${charCount > MAX_ESSAY_CHARACTERS || wordCount > MAX_WORDS ? 'text-[var(--danger)]' : 'text-[var(--text-2)]'}`}>
            {charCount > MAX_ESSAY_CHARACTERS || wordCount > MAX_WORDS ? inputValidation : 'Escreva de 100 a 500 palavras.'}
          </p>
          <div className="space-y-3 border-t border-[var(--border)] px-5 py-4">
            <p id="essay-counter" className="text-sm tabular-nums" style={{ color: countColor }}>{countMessage}</p>
            <div aria-hidden="true" className="relative h-2 rounded-full bg-[var(--surface-2)]">
              <div className="h-full rounded-full transition-[width] duration-200" style={{ width: `${Math.min(wordCount / MAX_WORDS * 100, 100)}%`, backgroundColor: countColor }} />
              <span className="absolute top-[-3px] h-3.5 border-l-2 border-[var(--text-2)]" style={{ left: `${MIN_WORDS / MAX_WORDS * 100}%` }} />
              <span className="absolute right-0 top-[-3px] h-3.5 border-l-2 border-[var(--text-2)]" />
            </div>
            <div aria-hidden="true" className="relative h-5 text-sm text-[var(--text-2)]"><span className="absolute -translate-x-1/2" style={{ left: '20%' }}>100 mín.</span><span className="absolute right-0">500 máx.</span></div>
            <p className="sr-only" aria-live="polite" role="status">{announcements.count}</p>
          </div>
        </div>
        <p className="mt-3 text-sm text-[var(--text-2)]">O rascunho fica neste navegador e endereço. Para usar outro aparelho ou endereço, copie seu texto.</p>
      </section>

      <section className={styles.submit} aria-labelledby="essay-submit-title">
        <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
          <h2 id="essay-submit-title" className="text-base font-semibold text-[var(--text)]">3. Correção</h2>
          <RequirementsChecklist hasTheme={hasSelectedTheme} wordCount={wordCount} manualTheme={themeMode === 'manual' ? manualTheme : ''} themeValidation={themeValidation} />
          <p className="text-sm leading-relaxed text-[var(--text-2)]">Nota de 0 a 200 em cada uma das 5 competências, com total de 0 a 1000. O tempo de análise pode variar.</p>
          {correctionError && <FlowStatus error>{correctionError}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>}
          {correcting && <FlowStatus>Analisando sua redação e salvando a correção… Aguarde nesta página para ver o resultado.</FlowStatus>}
          {!operatingHours.isOpen && <p className="text-sm text-[var(--warning)]">As correções ficam disponíveis das 7h às 23h30, no horário de Brasília. Seu rascunho pode ser editado e salvo agora.</p>}
          <div ref={actionsRef} className={`${styles.actions} ${editing ? styles.actionsInFlow : ''}`}>
            <div className={styles.actionInner}>
              <p id="essay-submit-reason" className="mb-2 text-sm text-[var(--text-2)]">{reason || 'Pronto para enviar sua redação.'}</p>
              <button type="button" aria-disabled={submitUnavailable} aria-describedby="essay-submit-reason"
                onClick={() => { if (!submitUnavailable) void submitEssay(); }}
                className={`flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${submitUnavailable
                  ? 'cursor-not-allowed border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-2)]'
                  : 'border-transparent bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)]'}`}>
                {correcting ? <SpinnerIcon /> : <SendIcon />}
                {submitLabel}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  </div>;
}

export default function RedacaoPageClient({ operatingHours }: { operatingHours: OperatingHoursInfo }) {
  const { user } = useAuth();
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><FlowStatus>Entre novamente para recuperar seu rascunho. <Link href="/login" className="underline">Entrar</Link></FlowStatus></div>;
  return <EssayWorkflow key={user.id} userId={user.id} initialHours={operatingHours} />;
}
