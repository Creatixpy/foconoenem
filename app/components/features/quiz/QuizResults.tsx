'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Question, QuizResult } from '@/types';

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
// Props
// ---------------------------------------------------------------------------
interface QuizResultsProps {
  result: QuizResult;
  questions: Question[];
  selectedAnswers: Record<string, string>;
  onNewQuiz: () => void;
}

// ---------------------------------------------------------------------------
// Score color helper
// ---------------------------------------------------------------------------
function scoreColor(pct: number): string {
  if (pct < 40) return 'var(--danger)';
  if (pct < 60) return 'var(--warning)';
  if (pct < 80) return 'var(--warning-hover)';
  return 'var(--ai)';
}

function scoreLabel(pct: number): string {
  if (pct < 40) return 'Precisa melhorar';
  if (pct < 60) return 'Em desenvolvimento';
  if (pct < 80) return 'Bom desempenho';
  return 'Excelente!';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuizResults({
  result,
  questions,
  selectedAnswers,
  onNewQuiz,
}: QuizResultsProps) {
  const [reviewExpanded, setReviewExpanded] = useState<Record<string, boolean>>({});

  const pct = result.totalQuestions > 0
    ? Math.round((result.correctAnswers / result.totalQuestions) * 100)
    : 0;
  const color = scoreColor(pct);

  // chart data grouped by discipline
  const chartData = useMemo(() => {
    const map: Record<string, { total: number; correct: number }> = {};
    for (const q of questions) {
      if (!map[q.discipline]) map[q.discipline] = { total: 0, correct: 0 };
      map[q.discipline].total++;
      const selected = selectedAnswers[q.id];
      const alt = q.alternatives.find((a) => a.id === selected);
      if (alt?.isCorrect) map[q.discipline].correct++;
    }
    return Object.entries(map).map(([name, { total, correct }]) => ({
      name,
      acertos: correct,
      erros: total - correct,
      fill: DISCIPLINE_COLORS[name] || 'var(--brand)',
    }));
  }, [questions, selectedAnswers]);

  // SVG circular progress
  const radius = 70;
  const stroke = 7;
  const nr = radius - stroke / 2;
  const circ = 2 * Math.PI * nr;

  return (
    <div className="max-w-3xl mx-auto space-y-10">
      {/* ── Score hero ────────────────────────────────── */}
      <motion.section
        className="text-center space-y-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-3)]">
          <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Resultado do simulado
        </div>

        {/* circular score */}
        <div className="relative inline-flex items-center justify-center">
          <svg width={radius * 2} height={radius * 2} className="-rotate-90">
            <circle cx={radius} cy={radius} r={nr} fill="none" stroke="var(--border)" strokeWidth={stroke} />
            <motion.circle
              cx={radius} cy={radius} r={nr} fill="none"
              stroke={color} strokeWidth={stroke} strokeLinecap="round"
              strokeDasharray={circ}
              initial={{ strokeDashoffset: circ }}
              animate={{ strokeDashoffset: circ * (1 - pct / 100) }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span
              className="text-3xl sm:text-4xl font-bold"
              style={{ color }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {pct}%
            </motion.span>
            <span className="text-xs text-[var(--text-3)]">de acerto</span>
          </div>
        </div>

        <p className="text-lg font-semibold text-[var(--text)]">
          {result.correctAnswers} / {result.totalQuestions} questões certas
        </p>
        <p className="text-sm font-medium" style={{ color }}>{scoreLabel(pct)}</p>
      </motion.section>

      {/* ── Discipline bar chart ──────────────────────── */}
      {chartData.length > 1 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[var(--text)] mb-4">Desempenho por disciplina</h3>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fill: 'var(--text-3)', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="acertos" name="Acertos" fill="var(--ai)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="erros" name="Erros" fill="var(--danger)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>
      )}

      {/* ── Per-question review ───────────────────────── */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
      >
        <h3 className="text-sm font-bold text-[var(--text)] mb-4">Revisão das questões</h3>
        <div className="space-y-3">
          {questions.map((q, i) => {
            const selected = selectedAnswers[q.id];
            const selectedAlt = q.alternatives.find((a) => a.id === selected);
            const correctAlt = q.alternatives.find((a) => a.isCorrect);
            const isCorrect = selectedAlt?.isCorrect ?? false;
            const expanded = reviewExpanded[q.id] ?? false;

            return (
              <div
                key={q.id}
                className={`rounded-xl border overflow-hidden transition-colors ${
                  isCorrect
                    ? 'border-[var(--ai)]/30 bg-[var(--ai)]/5'
                    : 'border-[var(--danger)]/30 bg-[var(--danger)]/5'
                }`}
              >
                <button
                  onClick={() =>
                    setReviewExpanded((prev) => ({ ...prev, [q.id]: !prev[q.id] }))
                  }
                  className="w-full flex items-center gap-3 p-4 text-left cursor-pointer"
                >
                  {/* status icon */}
                  <span
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                      isCorrect ? 'bg-[var(--ai)]' : 'bg-[var(--danger)]'
                    }`}
                  >
                    {isCorrect ? '✓' : '✗'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--text)] font-medium truncate">
                      Questão {i + 1}
                    </p>
                    <p className="text-xs text-[var(--text-3)]">{q.discipline}</p>
                  </div>
                  <span
                    className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: DISCIPLINE_COLORS[q.discipline] || 'var(--brand)' }}
                  >
                    {q.discipline}
                  </span>
                  <svg
                    className={`w-4 h-4 text-[var(--text-3)] transition-transform duration-200 flex-shrink-0 ${
                      expanded ? 'rotate-180' : ''
                    }`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]/30">
                    {/* question text */}
                    <p className="text-sm text-[var(--text-2)] leading-relaxed mt-3 whitespace-pre-line">
                      {q.text}
                    </p>
                    {/* your answer vs correct */}
                    <div className="grid sm:grid-cols-2 gap-2 text-sm">
                      <div className={`px-3 py-2 rounded-lg ${isCorrect ? 'bg-[var(--ai)]/10' : 'bg-[var(--danger)]/10'}`}>
                        <span className="text-xs text-[var(--text-3)]">Sua resposta</span>
                        <p className="text-[var(--text)] font-medium">
                          {selectedAlt ? `${selected}) ${selectedAlt.text}` : 'Não respondida'}
                        </p>
                      </div>
                      {!isCorrect && correctAlt && (
                        <div className="px-3 py-2 rounded-lg bg-[var(--ai)]/10">
                          <span className="text-xs text-[var(--text-3)]">Resposta correta</span>
                          <p className="text-[var(--ai)] font-medium">
                            {correctAlt.id}) {correctAlt.text}
                          </p>
                        </div>
                      )}
                    </div>
                    {/* explanation */}
                    {q.explanation && (
                      <div className="text-sm text-[var(--text-2)] leading-relaxed bg-[var(--surface)] rounded-lg p-3">
                        <span className="text-xs font-semibold text-[var(--brand)] block mb-1">Explicação</span>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </motion.section>

      {/* ── Action buttons ────────────────────────────── */}
      <motion.section
        className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <button
          onClick={onNewQuiz}
          className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
        >
          Novo simulado
        </button>
        <Link
          href="/conta"
          className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--text-2)] font-medium hover:bg-[var(--surface)] transition-colors text-center"
        >
          Ver meu perfil
        </Link>
      </motion.section>
    </div>
  );
}
