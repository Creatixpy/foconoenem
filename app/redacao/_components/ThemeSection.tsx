'use client';

import type { ReactNode } from 'react';
import type { EssayDraft } from '@/lib/contracts/student-drafts';
import FlowStatus from '@/app/components/shared/FlowStatus';
import { RefreshIcon, SparkleIcon, SpinnerIcon } from './icons';

function AccordionPanel({ title, children }: { title: string; children: ReactNode }) {
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

export default function ThemeSection({
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
  mode: EssayDraft['themeMode'];
  theme: EssayDraft['theme'];
  themeLoading: boolean;
  themeError: string;
  manualTheme: string;
  onModeChange: (mode: EssayDraft['themeMode']) => void;
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
