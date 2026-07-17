'use client';

import { motion } from 'motion/react';
import type { PublicQuestion } from '@/lib/contracts/quiz';

type QuestionCardProps = {
  question: PublicQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  submitting: boolean;
  submitError: string | null;
  onSelectAnswer: (alternativeId: string) => void;
  onNext: () => void;
};

const DISCIPLINE_COLORS: Record<string, string> = {
  Matemática: 'var(--brand)',
  Português: 'var(--brand-hover)',
  Química: 'var(--warning)',
  Física: 'var(--danger)',
  Geografia: 'var(--ai)',
};

export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  submitting,
  submitError,
  onSelectAnswer,
  onNext,
}: QuestionCardProps) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const isLast = questionIndex === totalQuestions - 1;

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -32 }}
      className="max-w-3xl mx-auto"
    >
      <div className="mb-6">
        <div className="mb-2 flex justify-between text-xs text-[var(--text-3)]">
          <span>Questão {questionIndex + 1} de {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
          <motion.div
            className="h-full rounded-full bg-[var(--brand)]"
            animate={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <span
        className="mb-4 inline-flex rounded-full px-2.5 py-1 text-xs font-medium text-white"
        style={{ backgroundColor: DISCIPLINE_COLORS[question.discipline] ?? 'var(--brand)' }}
      >
        {question.discipline}
      </span>

      <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p className="whitespace-pre-line text-base leading-relaxed text-[var(--text)] sm:text-lg">
          {question.text}
        </p>
      </div>

      <div className="mb-6 space-y-3" role="radiogroup" aria-label="Alternativas">
        {question.alternatives.map((alternative) => {
          const selected = alternative.id === selectedAnswer;
          return (
            <button
              key={alternative.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelectAnswer(alternative.id)}
              disabled={submitting}
              className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-colors disabled:cursor-wait ${
                selected
                  ? 'border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)]/30'
                  : 'border-[var(--border)] hover:border-[var(--border-hover)]'
              }`}
            >
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-3)]'}`}>
                {alternative.id}
              </span>
              <span className="pt-0.5 text-sm leading-relaxed text-[var(--text)]">
                {alternative.text}
              </span>
            </button>
          );
        })}
      </div>

      {submitError && (
        <p className="mb-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]" role="alert">
          {submitError}
        </p>
      )}

      <button
        type="button"
        onClick={onNext}
        disabled={submitting}
        className="rounded-lg bg-[var(--brand)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-wait disabled:opacity-60"
      >
        {submitting ? 'Finalizando...' : isLast ? (submitError ? 'Tentar finalizar novamente' : 'Finalizar simulado') : 'Próxima questão'}
      </button>
      {!selectedAnswer && !isLast && (
        <span className="ml-3 text-xs text-[var(--text-3)]">A questão será marcada como não respondida.</span>
      )}
    </motion.div>
  );
}
