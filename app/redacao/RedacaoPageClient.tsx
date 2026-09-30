'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useOperatingHours } from '@/lib/client/use-operating-hours';
import FlowStatus from '@/app/components/shared/FlowStatus';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import PhotoUpload from './PhotoUpload';
import styles from './redacao.module.css';
import { essaySubmitReason, hasMeaningfulEssayDraft, themeRequirementState, wordCountState, wordRequirementState, type RequirementState } from './essay-presentation';
import {
  MAX_WORDS,
  MIN_WORDS,
  MAX_ESSAY_CHARACTERS,
  useEssayWorkflow,
  type ThemeData,
  type ThemeMode,
} from './useEssayWorkflow';

/* ================================================================== */
/*  Icons                                                              */
/* ================================================================== */

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function CheckIcon({ color }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ color }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color ?? 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

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

/* ================================================================== */
/*  Accordion Panel                                                    */
/* ================================================================== */

function AccordionPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border border-[var(--border)]">
      <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)]">{title}</summary>
      <div className="whitespace-pre-line break-words px-4 pb-4 text-sm leading-relaxed text-[var(--text-2)]">{children}</div>
    </details>
  );
}

/* ================================================================== */
/*  Theme Section                                                      */
/* ================================================================== */

function ThemeSection({
  mode,
  theme,
  themeLoading,
  themeError,
  manualTheme,
  onModeChange,
  onManualThemeChange,
  onGenerate,
  disabled,
  canGenerate,
  validation,
  secondsToRetry,
}: {
  mode: ThemeMode;
  theme: ThemeData | null;
  themeLoading: boolean;
  themeError: string;
  manualTheme: string;
  onModeChange: (mode: ThemeMode) => void;
  onManualThemeChange: (value: string) => void;
  onGenerate: () => void;
  disabled: boolean;
  canGenerate: boolean;
  validation: string;
  secondsToRetry: number;
}) {
  return (
    <fieldset disabled={disabled} aria-labelledby="essay-theme-title" className="min-w-0 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h2 id="essay-theme-title" tabIndex={-1} className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">
        1. Tema da sua redação
      </h2>

      <div role="tablist" aria-label="Escolher tipo de tema" className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-1">
        {(['generated', 'manual'] as const).map((tab) => (
          <button key={tab} id={`theme-tab-${tab}`} type="button" role="tab"
            aria-selected={mode === tab} aria-controls={`theme-panel-${tab}`} tabIndex={mode === tab ? 0 : -1}
            onClick={() => onModeChange(tab)}
            onKeyDown={(event) => {
              if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
              event.preventDefault();
              const next = event.key === 'Home' ? 'generated' : event.key === 'End' ? 'manual' : mode === 'manual' ? 'generated' : 'manual';
              onModeChange(next);
              document.getElementById(`theme-tab-${next}`)?.focus();
            }}
            className={`min-h-12 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${mode === tab
              ? 'border-[var(--brand-hover)] bg-[var(--brand-soft)] text-[var(--text)]'
              : 'border-transparent text-[var(--text-2)] hover:bg-[var(--surface-2)]'}`}>
            {tab === 'generated' ? 'Tema com IA' : 'Tema manual'}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`theme-panel-${mode}`} aria-labelledby={`theme-tab-${mode}`}>

      {themeError && (
        <FlowStatus error>{themeError}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>
      )}
      {themeLoading && <FlowStatus>Preparando um tema e os textos de apoio…</FlowStatus>}

      {mode === 'manual' ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-3)]">
            Escolha uma questão social, cultural ou ambiental para discutir, como nos temas do ENEM. Use de 5 a 300 caracteres; os textos de apoio serão gerados durante a correção.
          </p>
          <label htmlFor="manual-theme" className="block text-sm font-medium text-[var(--text)]">Seu tema</label>
          <textarea
            id="manual-theme"
            aria-describedby="manual-theme-validation"
            aria-invalid={!!manualTheme && !!validation}
            value={manualTheme}
            onChange={(e) => onManualThemeChange(e.target.value)}
            placeholder="Ex.: Caminhos para combater a evasão escolar no Brasil"
            className="
              w-full min-h-[120px] rounded-xl border border-[var(--border)]
              bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)]
              placeholder:text-[var(--text-3)] resize-y
            "
          />
          <p id="manual-theme-validation" className={`text-sm ${manualTheme && validation ? 'text-[var(--warning)]' : 'text-[var(--text-3)]'}`}>{manualTheme.trim() ? validation || 'Tema pronto para usar.' : 'Escreva o tema com pelo menos 5 caracteres.'}</p>
        </div>
      ) : !theme ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-3)] mb-5">
            Gere um tema inédito com nossa IA para começar sua redação.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={themeLoading || !canGenerate}
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3 rounded-xl text-sm font-semibold
              bg-[var(--brand)] text-white
              hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]
              disabled:opacity-60 disabled:cursor-not-allowed
              transition-all duration-[var(--duration-fast)]
              shadow-sm
            "
          >
            {themeLoading ? (
              <SpinnerIcon size={16} />
            ) : (
              <SparkleIcon />
            )}
            {themeLoading ? 'Gerando tema...' : 'Gerar tema'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Theme title */}
          <p className="text-base font-semibold text-[var(--text)] leading-relaxed">
            {theme.tema}
          </p>

          {/* Supporting texts */}
          <div className="space-y-2">
            <AccordionPanel title="Texto de apoio I">
              {theme.textoApoio1}
            </AccordionPanel>
            <AccordionPanel title="Texto de apoio II">
              {theme.textoApoio2}
            </AccordionPanel>
          </div>

          {/* New theme button */}
          <button
            type="button"
            onClick={onGenerate}
            disabled={themeLoading || !canGenerate}
            className="
              inline-flex min-h-12 items-center gap-1.5 text-sm font-medium
              text-[var(--text-3)] hover:text-[var(--text-2)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {themeLoading ? <SpinnerIcon size={14} /> : <RefreshIcon />}
            Gerar outro tema
          </button>
        </div>
      )}
      </div>
    </fieldset>
  );
}

/* ================================================================== */
/*  Requirements Checklist                                             */
/* ================================================================== */

function RequirementsChecklist({ hasTheme, wordCount, manualTheme, themeValidation }: {
  hasTheme: boolean; wordCount: number; manualTheme: string; themeValidation: string;
}) {
  const items: { label: string; state: RequirementState }[] = [
    { label: 'Tema válido selecionado', state: themeRequirementState(hasTheme, manualTheme, themeValidation) },
    { label: `Mínimo ${MIN_WORDS} palavras`, state: wordRequirementState(wordCount) === 'pending' ? 'pending' : 'met' },
    { label: `Máximo ${MAX_WORDS} palavras`, state: wordCount <= MAX_WORDS ? 'met' : 'violated' },
  ];
  return <ul className="space-y-2.5" aria-label="Requisitos para correção">
    {items.map(({ label, state }) => <li key={label} className="flex items-center gap-2.5 text-sm text-[var(--text-2)]">
      <span aria-hidden="true" className={`shrink-0 ${state === 'met' ? 'text-[var(--success)]' : state === 'violated' ? 'text-[var(--danger)]' : 'text-[var(--text-3)]'}`}>
        {state === 'met' ? <CheckIcon /> : state === 'violated' ? <XIcon /> : <span className="block h-3.5 w-3.5 rounded-full border border-current" />}
      </span>
      <span>{label}<span className="sr-only">: {state === 'met' ? 'cumprido' : state === 'violated' ? 'violado' : 'pendente'}</span></span>
    </li>)}
  </ul>;
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
  const submitLabel = correcting ? 'Corrigindo…'
    : themeLoading ? 'Preparando tema…'
    : secondsToRetry > 0 ? `Aguarde ${secondsToRetry}s`
    : !operatingHours.isOpen ? 'Correção abre às 7h'
    : !hasSelectedTheme ? themeMode === 'manual' && manualTheme.trim() ? 'Revise o tema' : 'Escolha um tema'
    : charCount > MAX_ESSAY_CHARACTERS ? 'Reduza o texto'
    : wordCount > MAX_WORDS ? `Reduza ${wordCount - MAX_WORDS} ${wordCount - MAX_WORDS === 1 ? 'palavra' : 'palavras'}`
    : wordCount < MIN_WORDS ? `${MIN_WORDS - wordCount === 1 ? 'Falta' : 'Faltam'} ${MIN_WORDS - wordCount} ${MIN_WORDS - wordCount === 1 ? 'palavra' : 'palavras'}`
    : 'Corrigir com IA';
  const wordsState = wordCountState(wordCount);
  const countColor = wordsState === 'violated' ? 'var(--danger)' : wordsState === 'near-limit' ? 'var(--warning)' : wordsState === 'met' ? 'var(--success)' : 'var(--text-3)';
  const countMessage = `${wordCount} ${wordCount === 1 ? 'palavra' : 'palavras'}. ${wordCount < MIN_WORDS ? `Mínimo de ${MIN_WORDS} palavras.` : wordCount > MAX_WORDS ? 'Limite de palavras excedido.' : wordsState === 'near-limit' ? 'Perto do máximo de 500 palavras.' : 'Quantidade adequada para enviar.'}`;
  let draftMessage = '';
  if (draftStatus === 'invalid') draftMessage = 'Não foi possível recuperar o rascunho salvo neste navegador.';
  else if (meaningful && draftStatus === 'unavailable') draftMessage = 'O rascunho não pôde ser salvo. Mantenha esta página aberta ou copie seu texto.';
  else if (meaningful && draftStatus === 'stopped') draftMessage = 'O salvamento foi interrompido ao sair da conta. Copie seu texto antes de continuar.';
  else if (meaningful && (draftStatus === 'saved' || draftStatus === 'restored')) {
    const prefix = essay.trim() ? '' : 'Tema ';
    draftMessage = savedAt ? `${prefix}${prefix ? 'salvo' : 'Salvo'} às ${new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} neste navegador.` : `${prefix}${prefix ? 'recuperado' : 'Rascunho recuperado'} neste navegador.`;
  }
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
