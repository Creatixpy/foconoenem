'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import {
  DISCIPLINES,
  quizAttemptResponseSchema,
  quizResultSchema,
  type Discipline,
  type PublicQuestion,
  type QuizResult,
} from '@/lib/contracts/quiz';
import QuestionCard from '@/app/components/features/quiz/QuestionCard';
import QuizResults from '@/app/components/features/quiz/QuizResults';

const DISCIPLINE_DETAILS: Record<Discipline, { description: string; icon: string }> = {
  Matemática: { description: 'Álgebra, geometria e estatística', icon: '📐' },
  Português: { description: 'Interpretação, gramática e literatura', icon: '📖' },
  Química: { description: 'Química geral, orgânica e físico-química', icon: '🧪' },
  Física: { description: 'Mecânica, termodinâmica e óptica', icon: '⚡' },
  Geografia: { description: 'Brasil, mundo e geopolítica', icon: '🌎' },
};

const LOADING_MESSAGES = [
  'Selecionando questões...',
  'Preparando seu simulado...',
  'Validando o catálogo...',
];

type Phase = 'setup' | 'loading' | 'quiz' | 'results';

export default function QuestoesPageClient({
  operatingHours,
}: {
  operatingHours: OperatingHoursInfo;
}) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<Discipline>>(new Set());
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<{ id: string; disciplinesKey: string } | null>(null);

  useEffect(() => {
    if (phase !== 'loading') return;
    const timer = window.setInterval(
      () => setLoadingMessage((current) => (current + 1) % LOADING_MESSAGES.length),
      2_500
    );
    return () => window.clearInterval(timer);
  }, [phase]);

  const toggleDiscipline = (discipline: Discipline) => {
    setSelectedDisciplines((current) => {
      const next = new Set(current);
      if (next.has(discipline)) next.delete(discipline);
      else next.add(discipline);
      return next;
    });
    requestRef.current = null;
  };

  const startQuiz = useCallback(async () => {
    if (selectedDisciplines.size === 0) return;
    setPhase('loading');
    setLoadingMessage(0);
    setError(null);

    const disciplines = [...selectedDisciplines].sort();
    const disciplinesKey = disciplines.join('|');
    if (!requestRef.current || requestRef.current.disciplinesKey !== disciplinesKey) {
      requestRef.current = { id: crypto.randomUUID(), disciplinesKey };
    }

    try {
      const response = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId: requestRef.current.id, disciplines }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : 'Não foi possível preparar o simulado.';
        throw new Error(message);
      }
      const validated = quizAttemptResponseSchema.safeParse(payload);
      if (!validated.success) {
        throw new Error('O servidor retornou um simulado inválido.');
      }

      setQuestions(validated.data.questions);
      setAttemptId(validated.data.attemptId);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setResult(null);
      setPhase('quiz');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível preparar o simulado.');
      setPhase('setup');
    }
  }, [selectedDisciplines]);

  const finishQuiz = useCallback(async () => {
    if (!attemptId) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch('/api/questoes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, selectedAnswers }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(
          response.status === 410
            ? 'A tentativa expirou. Inicie um novo simulado.'
            : 'Não foi possível finalizar e salvar o resultado.'
        );
      }
      const validated = quizResultSchema.safeParse(
        payload && typeof payload === 'object' && 'result' in payload ? payload.result : null
      );
      if (!validated.success) throw new Error('O servidor retornou um resultado inválido.');
      setResult(validated.data);
      setPhase('results');
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível finalizar o simulado.');
    } finally {
      setSubmitting(false);
    }
  }, [attemptId, selectedAnswers]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setError(null);
      return;
    }
    void finishQuiz();
  };

  const reset = () => {
    requestRef.current = null;
    setPhase('setup');
    setQuestions([]);
    setAttemptId(null);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setResult(null);
    setError(null);
  };

  if (phase === 'setup') {
    return (
      <div className="mx-auto min-h-[80vh] max-w-3xl space-y-8 px-4 py-10 sm:px-6">
        <header className="space-y-3">
          <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-3)]">✦ Simulado com IA</span>
          <h1 className="text-3xl font-bold text-[var(--text)]">Simulado inteligente</h1>
          <p className="max-w-xl text-[var(--text-3)]">
            O gabarito e as explicações são liberados somente depois da correção canônica no servidor.
          </p>
          <p className={`text-sm ${operatingHours.isOpen ? 'text-[var(--ai)]' : 'text-[var(--warning)]'}`}>
            {operatingHours.isOpen ? 'Sistema disponível' : operatingHours.message}
          </p>
        </header>

        <section>
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">Escolha as disciplinas</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {DISCIPLINES.map((discipline) => {
              const selected = selectedDisciplines.has(discipline);
              const detail = DISCIPLINE_DETAILS[discipline];
              return (
                <button
                  key={discipline}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleDiscipline(discipline)}
                  className={`rounded-xl border p-4 text-left transition-colors ${selected ? 'border-[var(--brand)] bg-[var(--brand)]/10' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]'}`}
                >
                  <span className="text-2xl">{detail.icon}</span>
                  <p className="mt-2 text-sm font-semibold text-[var(--text)]">{discipline}</p>
                  <p className="mt-0.5 text-xs text-[var(--text-3)]">{detail.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {error && <p className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">{error}</p>}
        <button
          type="button"
          onClick={() => void startQuiz()}
          disabled={selectedDisciplines.size === 0 || !operatingHours.isOpen}
          className="rounded-lg bg-[var(--brand)] px-8 py-3 font-medium text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Iniciar simulado
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-center">
        <AnimatePresence mode="wait">
          <motion.p key={loadingMessage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-[var(--text)]">
            {LOADING_MESSAGES[loadingMessage]}
          </motion.p>
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'quiz' && questions[currentIndex]) {
    const currentQuestion = questions[currentIndex];
    return (
      <div className="min-h-[80vh] px-4 py-8 sm:px-6">
        <AnimatePresence mode="wait">
          <QuestionCard
            key={currentQuestion.id}
            question={currentQuestion}
            questionIndex={currentIndex}
            totalQuestions={questions.length}
            selectedAnswer={selectedAnswers[currentQuestion.id] ?? null}
            submitting={submitting}
            submitError={error}
            onSelectAnswer={(alternativeId) =>
              setSelectedAnswers((current) => ({
                ...current,
                [currentQuestion.id]: alternativeId,
              }))
            }
            onNext={handleNext}
          />
        </AnimatePresence>
      </div>
    );
  }

  if (phase === 'results' && result) {
    return <div className="min-h-[80vh] px-4 py-10 sm:px-6"><QuizResults result={result} onNewQuiz={reset} /></div>;
  }

  return null;
}
