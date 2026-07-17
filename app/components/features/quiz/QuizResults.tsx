'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import type { QuizResult } from '@/lib/contracts/quiz';

type QuizResultsProps = { result: QuizResult; onNewQuiz: () => void };

function scoreLabel(score: number) {
  if (score < 40) return 'Precisa melhorar';
  if (score < 60) return 'Em desenvolvimento';
  if (score < 80) return 'Bom desempenho';
  return 'Excelente!';
}

export default function QuizResults({ result, onNewQuiz }: QuizResultsProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const performance = useMemo(() => {
    const grouped = new Map<string, { total: number; correct: number }>();
    for (const question of result.questions) {
      const current = grouped.get(question.discipline) ?? { total: 0, correct: 0 };
      current.total += 1;
      if (question.isCorrect) current.correct += 1;
      grouped.set(question.discipline, current);
    }
    return [...grouped.entries()];
  }, [result.questions]);

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <p className="text-sm text-[var(--text-3)]">Resultado canônico salvo</p>
        <p className="mt-3 text-5xl font-bold text-[var(--brand)]">{result.score}%</p>
        <p className="mt-2 text-lg font-semibold text-[var(--text)]">
          {result.correctAnswers} de {result.totalQuestions} questões corretas
        </p>
        <p className="mt-1 text-sm text-[var(--text-3)]">
          {scoreLabel(result.score)} · {result.unansweredQuestions} não respondida(s)
        </p>
      </motion.section>

      {performance.length > 1 && (
        <section className="grid gap-3 sm:grid-cols-2">
          {performance.map(([discipline, values]) => (
            <div key={discipline} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
              <p className="text-sm font-semibold text-[var(--text)]">{discipline}</p>
              <p className="mt-1 text-xs text-[var(--text-3)]">{values.correct}/{values.total} acertos</p>
            </div>
          ))}
        </section>
      )}

      <section>
        <h2 className="mb-4 text-sm font-bold text-[var(--text)]">Revisão das questões</h2>
        <div className="space-y-3">
          {result.questions.map((question, index) => {
            const isExpanded = expanded[question.id] ?? false;
            const selected = question.alternatives.find(
              (alternative) => alternative.id === question.selectedAlternativeId
            );
            const correct = question.alternatives.find(
              (alternative) => alternative.id === question.correctAlternativeId
            );

            return (
              <div key={question.id} className={`overflow-hidden rounded-xl border ${question.isCorrect ? 'border-[var(--ai)]/30 bg-[var(--ai)]/5' : 'border-[var(--danger)]/30 bg-[var(--danger)]/5'}`}>
                <button
                  type="button"
                  onClick={() => setExpanded((current) => ({ ...current, [question.id]: !isExpanded }))}
                  className="flex w-full items-center gap-3 p-4 text-left"
                  aria-expanded={isExpanded}
                >
                  <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${question.isCorrect ? 'bg-[var(--ai)]' : 'bg-[var(--danger)]'}`}>
                    {question.isCorrect ? '✓' : '✗'}
                  </span>
                  <span className="flex-1 text-sm font-medium text-[var(--text)]">Questão {index + 1} · {question.discipline}</span>
                  <span className="text-xs text-[var(--text-3)]">{isExpanded ? 'Fechar' : 'Revisar'}</span>
                </button>

                {isExpanded && (
                  <div className="space-y-3 border-t border-[var(--border)]/30 px-4 pb-4 pt-3 text-sm">
                    <p className="whitespace-pre-line leading-relaxed text-[var(--text-2)]">{question.text}</p>
                    <p className="rounded-lg bg-[var(--surface)] p-3 text-[var(--text-2)]">
                      <span className="block text-xs text-[var(--text-3)]">Sua resposta</span>
                      {selected ? `${selected.id}) ${selected.text}` : 'Não respondida'}
                    </p>
                    {!question.isCorrect && correct && (
                      <p className="rounded-lg bg-[var(--ai)]/10 p-3 text-[var(--ai)]">
                        <span className="block text-xs">Resposta correta</span>
                        {correct.id}) {correct.text}
                      </p>
                    )}
                    <p className="rounded-lg bg-[var(--surface)] p-3 leading-relaxed text-[var(--text-2)]">
                      <span className="mb-1 block text-xs font-semibold text-[var(--brand)]">Explicação</span>
                      {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col justify-center gap-3 sm:flex-row">
        <button type="button" onClick={onNewQuiz} className="rounded-lg bg-[var(--brand)] px-6 py-3 font-medium text-white hover:bg-[var(--brand-hover)]">
          Novo simulado
        </button>
        <Link href="/conta" className="rounded-lg border border-[var(--border)] px-6 py-3 text-center font-medium text-[var(--text-2)] hover:bg-[var(--surface)]">
          Ver meu perfil
        </Link>
      </section>
    </div>
  );
}
