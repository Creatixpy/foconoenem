'use client';

import { useEffect, useRef } from 'react';
import type { PublicQuestion } from '@/lib/contracts/quiz';

type QuestionCardProps = {
  question: PublicQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  locked: boolean;
  submitting: boolean;
  finishDisabled: boolean;
  retrying: boolean;
  onSelectAnswer: (alternativeId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
};

export default function QuestionCard({ question, questionIndex, totalQuestions, selectedAnswer, locked, submitting, finishDisabled, retrying, onSelectAnswer, onPrevious, onNext }: QuestionCardProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, []);
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const isLast = questionIndex === totalQuestions - 1;
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 ref={titleRef} tabIndex={-1} className="mb-2 text-base font-semibold text-[var(--text)]">Questão {questionIndex + 1} de {totalQuestions}</h1>
        <div role="progressbar" aria-label="Posição no simulado" aria-valuemin={1} aria-valuemax={totalQuestions} aria-valuenow={questionIndex + 1} className="h-1.5 overflow-hidden rounded-full bg-[var(--surface)]">
          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="mb-4 inline-flex rounded-full border border-[var(--border-hover)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--text)]">{question.discipline}</span>
      <div className="mb-5 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
        <p id={`question-${question.id}`} className="whitespace-pre-line break-words text-base leading-relaxed text-[var(--text)] sm:text-lg">{question.text}</p>
      </div>
      <fieldset disabled={locked} className="mb-6 space-y-3" aria-describedby={`question-${question.id}`}>
        <legend className="sr-only">Escolha uma alternativa</legend>
        {question.alternatives.map((alternative) => {
          const selected = alternative.id === selectedAnswer;
          return <label key={alternative.id} className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--brand-hover)] ${selected ? 'border-[var(--brand-hover)] bg-[var(--brand)]/10' : 'border-[var(--border)] hover:border-[var(--border-hover)]'} ${locked ? 'cursor-default' : ''}`}>
            <input type="radio" name={`answer-${question.id}`} value={alternative.id} checked={selected} onChange={() => onSelectAnswer(alternative.id)} className="sr-only" />
            <span aria-hidden="true" className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${selected ? 'bg-[var(--brand)] text-white' : 'bg-[var(--surface-2)] text-[var(--text-2)]'}`}>{alternative.id}</span>
            <span className="min-w-0 break-words pt-0.5 text-sm leading-relaxed text-[var(--text)]">{alternative.text}{selected && <span className="ml-2 text-[var(--brand-hover)]" aria-hidden="true">✓</span>}</span>
          </label>;
        })}
      </fieldset>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onPrevious} disabled={questionIndex === 0 || submitting} className="rounded-lg border border-[var(--border-hover)] px-6 py-3 font-medium text-[var(--text)] disabled:opacity-50">Anterior</button>
        <button type="button" onClick={onNext} disabled={submitting || (isLast && finishDisabled)} className="rounded-lg bg-[var(--brand)] px-6 py-3 font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
          {submitting ? 'Finalizando…' : isLast ? (retrying ? 'Tentar finalizar novamente' : 'Finalizar simulado') : 'Próxima questão'}
        </button>
      </div>
      {!selectedAnswer && !isLast && <p className="mt-3 text-xs text-[var(--text-3)]">Você pode voltar depois para responder esta questão.</p>}
    </div>
  );
}
