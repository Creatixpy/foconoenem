'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { useOperatingHours } from '@/lib/client/use-operating-hours';
import FlowStatus from '@/app/components/shared/FlowStatus';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import PhotoUpload from './PhotoUpload';
import {
  MAX_WORDS,
  MIN_WORDS,
  MAX_ESSAY_CHARACTERS,
  useEssayWorkflow,
  type MobileTab,
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

function PenToolIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium
        ${info.isOpen
          ? 'bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/20'
          : 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
        }
      `}
    >
      <ClockIcon />
      {info.isOpen ? `Aberto até ${info.closesAt}` : `Abre ${info.nextOpenTime}`}
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
        Tema da sua redação
      </h2>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)]">
        <button
          type="button"
          onClick={() => onModeChange('generated')}
          aria-pressed={mode === 'generated'}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'generated'
              ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-3)]'
          }`}
        >
          Tema com IA
        </button>
        <button
          type="button"
          onClick={() => onModeChange('manual')}
          aria-pressed={mode === 'manual'}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
              : 'text-[var(--text-3)]'
          }`}
        >
          Tema manual
        </button>
      </div>

      {themeError && (
        <FlowStatus error>{themeError}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>
      )}
      {themeLoading && <FlowStatus>Preparando um tema e os textos de apoio…</FlowStatus>}

      {mode === 'manual' ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-3)]">
            Escolha um tema de 5 a 300 caracteres. Os textos de apoio serão gerados durante a correção.
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
          <p id="manual-theme-validation" className={`text-sm ${manualTheme && validation ? 'text-[var(--warning)]' : 'text-[var(--text-3)]'}`}>{validation || `${manualTheme.trim().length}/300 caracteres`}</p>
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
              inline-flex items-center gap-1.5 text-xs font-medium
              text-[var(--text-3)] hover:text-[var(--text-2)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {themeLoading ? <SpinnerIcon size={14} /> : <RefreshIcon />}
            Novo tema
          </button>
        </div>
      )}
    </fieldset>
  );
}

/* ================================================================== */
/*  Requirements Checklist                                             */
/* ================================================================== */

function RequirementsChecklist({
  hasTheme,
  wordCount,
  charCount,
}: {
  hasTheme: boolean;
  wordCount: number;
  charCount: number;
}) {
  const items = [
    { label: 'Tema válido selecionado', met: hasTheme },
    { label: 'Máximo 5.000 caracteres', met: charCount <= MAX_ESSAY_CHARACTERS },
    { label: `Mínimo ${MIN_WORDS} palavras`, met: wordCount >= MIN_WORDS },
    { label: `Máximo ${MAX_WORDS} palavras`, met: wordCount <= MAX_WORDS && wordCount > 0 },
  ];

  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2.5">
          <span className={`shrink-0 ${item.met ? 'text-[var(--success)]' : 'text-[var(--text-3)]'}`}>
            {item.met ? <CheckIcon color="var(--success)" /> : <XIcon color="var(--text-3)" />}
          </span>
          <span className={`text-sm ${item.met ? 'text-[var(--text-2)]' : 'text-[var(--text-3)]'}`}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

function EssayWorkflow({ userId, initialHours }: { userId: string; initialHours: OperatingHoursInfo }) {
  const operatingHours = useOperatingHours(initialHours);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const discardButtonRef = useRef<HTMLButtonElement>(null);
  const discardConfirmationRef = useRef<HTMLDivElement>(null);
  const [discardRequested, setDiscardRequested] = useState(false);
  const [photoVersion, setPhotoVersion] = useState(0);
  const {
    themeMode,
    setThemeMode,
    theme,
    themeLoading,
    themeError,
    setThemeError,
    manualTheme,
    setManualTheme,
    essay,
    setEssay,
    correcting,
    correctionError,
    mobileTab,
    setMobileTab,
    wordCount,
    charCount,
    selectedThemeTitle,
    hasSelectedTheme,
    canSubmit,
    generateTheme: handleGenerateTheme,
    submitEssay: handleSubmit,
    ready, draftStatus, discardDraft, themeValidation, inputValidation, secondsToRetry, themeSecondsToRetry,
  } = useEssayWorkflow(userId);

  useEffect(() => { if (discardRequested) discardConfirmationRef.current?.focus(); }, [discardRequested]);
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      document.getElementById(`essay-${mobileTab}-title`)?.focus();
    }
  }, [mobileTab]);

  /* ---- Mobile Tab Navigation ---- */
  const MOBILE_TABS: { key: MobileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'theme', label: 'Tema', icon: <BookIcon /> },
    { key: 'write', label: 'Escrever', icon: <PenToolIcon /> },
    { key: 'submit', label: 'Enviar', icon: <SendIcon /> },
  ];

  if (!ready) return <div className="mx-auto max-w-6xl px-4 py-10"><FlowStatus>Recuperando seu rascunho…</FlowStatus></div>;

  return (
    <>
      <div className="student-flow max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* ---- Page Header ---- */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand)]/10 text-[var(--text-2)] border border-[var(--brand)]/20">
              <SparkleIcon /> Redação com IA
            </span>
            <OperatingHoursPill info={operatingHours} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)] tracking-tight">
            Escreva sua redação
          </h1>
          <p className="mt-2 text-sm text-[var(--text-3)] max-w-xl">
            Gere um tema com IA ou escreva o seu próprio tema, produza sua redação dissertativa-argumentativa e receba feedback detalhado com nota por competência.
          </p>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p role="status" className="text-xs text-[var(--text-3)]">
            {draftStatus === 'unavailable' ? 'O rascunho não pôde ser salvo. Mantenha esta página aberta ou copie seu texto.' : draftStatus === 'stopped' ? 'O salvamento foi interrompido ao sair da conta. Copie seu texto antes de continuar.' : draftStatus === 'invalid' ? 'Não foi possível recuperar o rascunho salvo neste navegador.' : draftStatus === 'restored' ? 'Rascunho recuperado neste navegador.' : draftStatus === 'saved' ? 'Rascunho salvo neste navegador.' : 'Seu rascunho será salvo neste navegador.'}
          </p>
          <button ref={discardButtonRef} type="button" disabled={correcting || (!essay && !manualTheme && !theme)} onClick={() => setDiscardRequested(true)} className="rounded-lg border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)] disabled:opacity-50">Descartar rascunho</button>
        </div>
        {discardRequested && <div ref={discardConfirmationRef} tabIndex={-1} className="mb-5 rounded-xl border border-[var(--warning)]/40 p-4" role="group" aria-label="Confirmar descarte do rascunho">
          <p className="text-sm text-[var(--text-2)]">Descartar o texto e o tema salvos neste navegador?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button type="button" disabled={correcting} onClick={() => { discardDraft(); setDiscardRequested(false); setPhotoVersion((value) => value + 1); window.requestAnimationFrame(() => document.getElementById('essay-theme-title')?.focus()); }} className="rounded-lg bg-[var(--brand)] px-4 py-3 text-sm text-white">Descartar rascunho</button>
            <button type="button" onClick={() => { setDiscardRequested(false); discardButtonRef.current?.focus(); }} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">Cancelar</button>
          </div>
        </div>}

        {/* ---- Mobile Tabs (lg:hidden) ---- */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            {MOBILE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                aria-pressed={mobileTab === tab.key}
                aria-controls={`essay-${tab.key}-panel`}
                className={`
                  min-w-0 flex-1 flex items-center justify-center gap-1 px-2 py-2.5 rounded-lg text-xs font-medium whitespace-nowrap
                  transition-all duration-200
                  ${mobileTab === tab.key
                    ? 'bg-[var(--surface-2)] text-[var(--text)] shadow-sm'
                    : 'text-[var(--text-3)]'
                  }
                `}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Desktop: Two-column layout ---- */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* ---- Left: Editor ---- */}
          <div id="essay-write-panel" className={`min-w-0 flex-1 space-y-4 ${mobileTab !== 'write' ? 'hidden lg:block' : ''}`}>
            {/* Theme pill (mobile compact — shown only in write tab) */}
            {hasSelectedTheme && (
              <div className="lg:hidden">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-xs font-medium text-[var(--text-3)]">Tema:</span>
                  <span className="text-xs text-[var(--text-2)] truncate flex-1">{selectedThemeTitle}</span>
                  <button
                    type="button"
                    onClick={() => setMobileTab('theme')}
                    className="rounded-lg px-2 text-xs text-[var(--brand-hover)] font-medium shrink-0"
                  >
                    Ver
                  </button>
                </div>
              </div>
            )}

            {/* Editor card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-[var(--border)]">
                <h2 id="essay-write-title" tabIndex={-1} className="text-sm font-semibold text-[var(--text)]"><label htmlFor="essay-text">Sua redação</label></h2>
                <span className="text-xs text-[var(--text-3)] tabular-nums">
                  {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'} · {charCount} caracteres
                </span>
              </div>

              {/* Photo upload */}
              <PhotoUpload
                key={photoVersion}
                currentText={essay}
                onTextExtracted={(text) => {
                  setEssay(text);
                  setMobileTab('write');
                  window.requestAnimationFrame(() => editorRef.current?.focus());
                }}
                disabled={correcting}
              />

              {/* Textarea */}
              <textarea
                ref={editorRef}
                id="essay-text"
                aria-describedby="essay-validation"
                aria-invalid={!!essay && !!inputValidation}
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="Comece sua redação aqui..."
                disabled={correcting}
                className="
                  w-full min-h-[400px] sm:min-h-[500px] p-5 sm:p-6
                  text-base leading-[1.8] font-[var(--font-inter)]
                  bg-transparent text-[var(--text)]
                  placeholder:text-[var(--text-3)]/50
                  resize-y
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />

              <p id="essay-validation" className={`px-5 pb-3 text-sm ${essay && inputValidation ? 'text-[var(--warning)]' : 'text-[var(--text-3)]'}`}>{inputValidation || 'Entre 100 e 500 palavras e até 5.000 caracteres.'}</p>

              {/* Word count bar */}
              <div className="px-5 py-3 border-t border-[var(--border)] flex flex-wrap gap-2 items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-32 h-1.5 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.min((wordCount / MAX_WORDS) * 100, 100)}%`,
                        backgroundColor:
                          wordCount > MAX_WORDS
                            ? 'var(--danger)'
                            : wordCount >= MIN_WORDS
                            ? 'var(--success)'
                            : 'var(--brand)',
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--text-3)]">
                    {wordCount}/{MAX_WORDS}
                  </span>
                </div>
                {wordCount > MAX_WORDS && (
                  <span className="text-xs text-[var(--danger)] font-medium">
                    Excedeu o limite de palavras
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ---- Right: Sidebar ---- */}
          <div className={`lg:w-[360px] xl:w-[400px] shrink-0 space-y-5 ${mobileTab === 'write' ? 'hidden lg:block' : ''}`}>
            {/* Theme section (shown in theme tab on mobile, always on desktop) */}
            <div id="essay-theme-panel" className={`${mobileTab !== 'theme' ? 'hidden lg:block' : ''}`}>
              <ThemeSection
                disabled={correcting}
                canGenerate={operatingHours.isOpen && themeSecondsToRetry === 0}
                secondsToRetry={themeSecondsToRetry}
                validation={themeValidation}
                mode={themeMode}
                theme={theme}
                themeLoading={themeLoading}
                themeError={themeError}
                manualTheme={manualTheme}
                onModeChange={(mode) => {
                  setThemeMode(mode);
                  setThemeError('');
                }}
                onManualThemeChange={(value) => {
                  setManualTheme(value);
                  setThemeError('');
                }}
                onGenerate={handleGenerateTheme}
              />
            </div>

            {/* Submit section (shown in submit tab on mobile, always on desktop) */}
            <div id="essay-submit-panel" className={`${mobileTab !== 'submit' ? 'hidden lg:block' : ''}`}>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
                <h2 id="essay-submit-title" tabIndex={-1} className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider">
                  Enviar para correção
                </h2>

                {/* Requirements */}
                <RequirementsChecklist hasTheme={hasSelectedTheme} wordCount={wordCount} charCount={charCount} />

                {/* Error */}
                {correctionError && <FlowStatus error>{correctionError}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>}
                {correcting && <FlowStatus>Analisando sua redação e salvando a correção… Aguarde nesta página para ver o resultado.</FlowStatus>}

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canSubmit || !operatingHours.isOpen}
                  className="
                    w-full flex items-center justify-center gap-2
                    px-5 py-3.5 rounded-xl text-sm font-semibold
                    bg-[var(--brand)] text-white
                    hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]
                    disabled:opacity-40 disabled:cursor-not-allowed
                    transition-all duration-[var(--duration-fast)]
                    shadow-sm
                  "
                >
                  <SendIcon />
                  {correcting ? 'Corrigindo…' : 'Corrigir com IA'}
                </button>

                {/* Operating hours warning */}
                {!operatingHours.isOpen && (
                  <p className="text-xs text-[var(--warning)] text-center leading-relaxed">
                    As correções ficam disponíveis das 7h às 23h30, no horário de Brasília. Seu rascunho pode ser editado e salvo agora.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function RedacaoPageClient({ operatingHours }: { operatingHours: OperatingHoursInfo }) {
  const { user } = useAuth();
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><FlowStatus>Entre novamente para recuperar seu rascunho. <Link href="/login" className="underline">Entrar</Link></FlowStatus></div>;
  return <EssayWorkflow key={user.id} userId={user.id} initialHours={operatingHours} />;
}
