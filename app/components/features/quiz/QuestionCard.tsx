'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import type { Question } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AnswerState = 'unanswered' | 'selected' | 'revealed';

interface QuestionCardProps {
  question: Question;
  questionIndex: number;
  totalQuestions: number;
  selectedAnswer: string | null;
  answerState: AnswerState;
  onSelectAnswer: (alternativeId: string) => void;
  onConfirm: () => void;
  onNext: () => void;
}

// ---------------------------------------------------------------------------
// Discipline colors
// ---------------------------------------------------------------------------
const DISCIPLINE_COLORS: Record<string, string> = {
  Matemática: 'var(--brand)',
  Português: 'var(--brand-hover)',
  Química: 'var(--warning)',
  Física: 'var(--danger)',
  Geografia: 'var(--ai)',
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  answerState,
  onSelectAnswer,
  onConfirm,
  onNext,
}: QuestionCardProps) {
  const disciplineColor = DISCIPLINE_COLORS[question.discipline] || 'var(--brand)';
  const correctAlt = question.alternatives.find((a) => a.isCorrect);
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const [explanationExpanded, setExplanationExpanded] = useState(false);

  function getAltStyle(alt: (typeof question.alternatives)[0]) {
    if (answerState === 'revealed') {
      if (alt.isCorrect) {
        return 'border-[var(--ai)] bg-[var(--ai)]/10 ring-1 ring-[var(--ai)]/30';
      }
      if (alt.id === selectedAnswer && !alt.isCorrect) {
        return 'border-[var(--danger)] bg-[var(--danger)]/10 ring-1 ring-[var(--danger)]/30';
      }
      return 'border-[var(--border)] opacity-50';
    }
    if (alt.id === selectedAnswer) {
      return 'border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)]/30';
    }
    return 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[var(--surface)]';
  }

  function getAltIcon(alt: (typeof question.alternatives)[0]) {
    if (answerState !== 'revealed') return null;
    if (alt.isCorrect) {
      return (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--ai)] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </span>
      );
    }
    if (alt.id === selectedAnswer && !alt.isCorrect) {
      return (
        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[var(--danger)] flex items-center justify-center">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </span>
      );
    }
    return null;
  }

  return (
    <motion.div
      key={question.id}
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      transition={{ duration: 0.35 }}
      className="max-w-3xl mx-auto"
    >
      {/* progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs text-[var(--text-3)] mb-2">
          <span>Questão {questionIndex + 1} de {totalQuestions}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--surface)] overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-[var(--brand)]"
            initial={{ width: `${((questionIndex) / totalQuestions) * 100}%` }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
      </div>

      {/* discipline badge */}
      <div className="mb-4">
        <span
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
          style={{ backgroundColor: disciplineColor }}
        >
          {question.discipline}
        </span>
      </div>

      {/* question text */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6 mb-5">
        <p className="text-[var(--text)] text-base sm:text-lg leading-relaxed whitespace-pre-line">
          {question.text}
        </p>
      </div>

      {/* alternatives */}
      <div className="space-y-3 mb-6">
        {question.alternatives.map((alt, i) => {
          const letter = String.fromCharCode(65 + i);
          const isDisabled = answerState === 'revealed';
          return (
            <button
              key={alt.id}
              onClick={() => !isDisabled && onSelectAnswer(alt.id)}
              disabled={isDisabled}
              className={`w-full text-left flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer disabled:cursor-default ${getAltStyle(alt)}`}
            >
              <span
                className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                  alt.id === selectedAnswer && answerState !== 'revealed'
                    ? 'bg-[var(--brand)] text-white'
                    : alt.isCorrect && answerState === 'revealed'
                    ? 'bg-[var(--ai)] text-white'
                    : alt.id === selectedAnswer && answerState === 'revealed' && !alt.isCorrect
                    ? 'bg-[var(--danger)] text-white'
                    : 'bg-[var(--surface)] text-[var(--text-3)]'
                }`}
              >
                {letter}
              </span>
              <span className="text-sm text-[var(--text)] leading-relaxed flex-1 pt-0.5">
                {alt.text}
              </span>
              {getAltIcon(alt)}
            </button>
          );
        })}
      </div>

      {/* confirm / next button */}
      {answerState === 'selected' && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
          >
            Confirmar resposta
          </button>
        </motion.div>
      )}

      {/* explanation + next after reveal */}
      {answerState === 'revealed' && (
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* result banner */}
          {selectedAnswer && correctAlt && (
            <div
              className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium ${
                selectedAnswer === correctAlt.id
                  ? 'bg-[var(--ai)]/10 text-[var(--ai)] border border-[var(--ai)]/20'
                  : 'bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20'
              }`}
            >
              {selectedAnswer === correctAlt.id ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resposta correta!
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Resposta incorreta
                </>
              )}
            </div>
          )}

          {/* explanation accordion */}
          {question.explanation && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <button
                onClick={() => setExplanationExpanded(!explanationExpanded)}
                className="w-full flex items-center justify-between p-4 cursor-pointer hover:bg-[var(--surface)] transition-colors"
              >
                <span className="text-sm font-semibold text-[var(--text)] flex items-center gap-2">
                  <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                  </svg>
                  Explicação
                </span>
                <svg
                  className={`w-4 h-4 text-[var(--text-3)] transition-transform duration-200 ${
                    explanationExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {explanationExpanded && (
                <div className="px-4 pb-4 border-t border-[var(--border)]">
                  <p className="text-sm text-[var(--text-2)] leading-relaxed mt-3 whitespace-pre-line">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* next button */}
          <button
            onClick={onNext}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer flex items-center gap-2"
          >
            {questionIndex < totalQuestions - 1 ? 'Próxima questão' : 'Ver resultado'}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
