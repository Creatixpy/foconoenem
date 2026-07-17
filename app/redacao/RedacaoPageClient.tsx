'use client';

import { useEffect, useState } from 'react';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import PhotoUpload from './PhotoUpload';
import {
  MAX_WORDS,
  MIN_WORDS,
  useEssayWorkflow,
  type MobileTab,
  type ThemeData,
  type ThemeMode,
} from './useEssayWorkflow';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const CORRECTION_MESSAGES = [
  'Analisando sua redação...',
  'Verificando competências...',
  'Avaliando argumentação...',
  'Gerando feedback detalhado...',
];

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

function ChevronDownIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
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

function AlertTriangleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
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
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-[var(--border)] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-colors"
      >
        {title}
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          <ChevronDownIcon />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}
      >
        <div className="px-4 pb-4 text-sm text-[var(--text-3)] leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Correction Overlay                                                 */
/* ================================================================== */

function CorrectionOverlay() {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % CORRECTION_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/80 backdrop-blur-sm">
      <div className="text-center space-y-6 px-4">
        {/* Animated spinner */}
        <div className="relative mx-auto w-16 h-16">
          <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--brand)] animate-spin" />
        </div>

        {/* Progress message */}
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[var(--text)]">
            {CORRECTION_MESSAGES[msgIndex]}
          </p>
          <p className="text-sm text-[var(--text-3)]">
            Isso pode levar até 30 segundos
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {CORRECTION_MESSAGES.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                i <= msgIndex ? 'bg-[var(--brand)]' : 'bg-[var(--border)]'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
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
}: {
  mode: ThemeMode;
  theme: ThemeData | null;
  themeLoading: boolean;
  themeError: string;
  manualTheme: string;
  onModeChange: (mode: ThemeMode) => void;
  onManualThemeChange: (value: string) => void;
  onGenerate: () => void;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
      <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider mb-4">
        Tema da sua redação
      </h3>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-[var(--surface)] p-1 border border-[var(--border)]">
        <button
          type="button"
          onClick={() => onModeChange('generated')}
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
        <div className="mb-4 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
          {themeError}
        </div>
      )}

      {mode === 'manual' ? (
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-3)]">
            Digite seu próprio tema. Se você não enviar textos de apoio, a IA vai gerá-los automaticamente durante a correção.
          </p>
          <textarea
            value={manualTheme}
            onChange={(e) => onManualThemeChange(e.target.value)}
            placeholder="Ex.: Caminhos para combater a evasão escolar no Brasil"
            className="
              w-full min-h-[120px] rounded-xl border border-[var(--border)]
              bg-[var(--bg)] px-4 py-3 text-sm text-[var(--text)]
              placeholder:text-[var(--text-3)] outline-none resize-none
            "
          />
        </div>
      ) : !theme ? (
        <div className="text-center py-6">
          <p className="text-sm text-[var(--text-3)] mb-5">
            Gere um tema inédito com nossa IA para começar sua redação.
          </p>
          <button
            type="button"
            onClick={onGenerate}
            disabled={themeLoading}
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
            disabled={themeLoading}
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
    </div>
  );
}

/* ================================================================== */
/*  Requirements Checklist                                             */
/* ================================================================== */

function RequirementsChecklist({
  hasTheme,
  wordCount,
}: {
  hasTheme: boolean;
  wordCount: number;
}) {
  const items = [
    { label: 'Tema selecionado', met: hasTheme },
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

export default function RedacaoPageClient({
  operatingHours,
}: {
  operatingHours: OperatingHoursInfo;
}) {
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
  } = useEssayWorkflow();

  /* ---- Mobile Tab Navigation ---- */
  const MOBILE_TABS: { key: MobileTab; label: string; icon: React.ReactNode }[] = [
    { key: 'theme', label: 'Tema', icon: <BookIcon /> },
    { key: 'write', label: 'Escrever', icon: <PenToolIcon /> },
    { key: 'submit', label: 'Enviar', icon: <SendIcon /> },
  ];

  return (
    <>
      {/* Correction overlay */}
      {correcting && <CorrectionOverlay />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* ---- Page Header ---- */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--brand)]/10 text-[var(--brand)] border border-[var(--brand)]/20">
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

        {/* ---- Mobile Tabs (lg:hidden) ---- */}
        <div className="lg:hidden mb-6">
          <div className="flex gap-1 p-1 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
            {MOBILE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setMobileTab(tab.key)}
                className={`
                  flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-medium
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
          <div className={`flex-1 space-y-4 ${mobileTab !== 'write' ? 'hidden lg:block' : ''}`}>
            {/* Theme pill (mobile compact — shown only in write tab) */}
            {hasSelectedTheme && (
              <div className="lg:hidden">
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)]">
                  <span className="text-xs font-medium text-[var(--text-3)]">Tema:</span>
                  <span className="text-xs text-[var(--text-2)] truncate flex-1">{selectedThemeTitle}</span>
                  <button
                    type="button"
                    onClick={() => setMobileTab('theme')}
                    className="text-xs text-[var(--brand)] font-medium shrink-0"
                  >
                    Ver
                  </button>
                </div>
              </div>
            )}

            {/* Editor card */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              {/* Editor toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--border)]">
                <span className="text-xs text-[var(--text-3)]">
                  Redação dissertativa-argumentativa · Máximo 30 linhas
                </span>
                <span className="text-xs text-[var(--text-3)] tabular-nums">
                  {wordCount} {wordCount === 1 ? 'palavra' : 'palavras'} · {charCount} caracteres
                </span>
              </div>

              {/* Photo upload */}
              <PhotoUpload
                onTextExtracted={(text) => {
                  setEssay(text);
                  setMobileTab('submit');
                }}
                disabled={correcting}
              />

              {/* Textarea */}
              <textarea
                value={essay}
                onChange={(e) => setEssay(e.target.value)}
                placeholder="Comece sua redação aqui..."
                disabled={correcting}
                className="
                  w-full min-h-[400px] sm:min-h-[500px] p-5 sm:p-6
                  text-[15px] leading-[1.8] font-[var(--font-inter)]
                  bg-transparent text-[var(--text)]
                  placeholder:text-[var(--text-3)]/50
                  resize-none outline-none
                  disabled:opacity-50 disabled:cursor-not-allowed
                "
              />

              {/* Word count bar */}
              <div className="px-5 py-3 border-t border-[var(--border)] flex items-center justify-between">
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
            <div className={`${mobileTab !== 'theme' ? 'hidden lg:block' : ''}`}>
              <ThemeSection
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
            <div className={`${mobileTab !== 'submit' ? 'hidden lg:block' : ''}`}>
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-5">
                <h3 className="text-sm font-semibold text-[var(--text)] uppercase tracking-wider">
                  Enviar para correção
                </h3>

                {/* Requirements */}
                <RequirementsChecklist hasTheme={hasSelectedTheme} wordCount={wordCount} />

                {/* Error */}
                {correctionError && (
                  <div className="px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20 flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5"><AlertTriangleIcon /></span>
                    <span>{correctionError}</span>
                  </div>
                )}

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
                  Corrigir com IA
                </button>

                {/* Operating hours warning */}
                {!operatingHours.isOpen && (
                  <p className="text-xs text-[var(--warning)] text-center leading-relaxed">
                    O sistema está fora do horário de funcionamento. A correção pode não estar disponível no momento.
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
