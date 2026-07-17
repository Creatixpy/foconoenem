'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth/context';
import { getOperatingHoursInfo } from '@/lib/schedule';
import type { Question, QuizResult } from '@/types';
import QuestionCard from '@/app/components/features/quiz/QuestionCard';
import QuizResults from '@/app/components/features/quiz/QuizResults';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
type Discipline = Question['discipline'];

const DISCIPLINES: { id: Discipline; label: string; description: string; icon: string }[] = [
  { id: 'Matemática', label: 'Matemática', description: 'Álgebra, geometria, estatística', icon: '📐' },
  { id: 'Português', label: 'Português', description: 'Gramática, interpretação, literatura', icon: '📖' },
  { id: 'Química', label: 'Química', description: 'Orgânica, inorgânica, físico-química', icon: '🧪' },
  { id: 'Física', label: 'Física', description: 'Mecânica, termodinâmica, óptica', icon: '⚡' },
  { id: 'Geografia', label: 'Geografia', description: 'Brasil, mundo, geopolítica', icon: '🌎' },
];

const QUESTIONS_PER_DISCIPLINE = 3;

const LOADING_MESSAGES = [
  'Gerando questões personalizadas...',
  'Preparando seu simulado...',
  'Selecionando questões desafiadoras...',
  'Quase pronto...',
];

type Phase = 'setup' | 'loading' | 'quiz' | 'results';
type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function QuestoesPageClient() {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuth();

  // phase
  const [phase, setPhase] = useState<Phase>('setup');

  // setup state
  const [selectedDisciplines, setSelectedDisciplines] = useState<Set<Discipline>>(new Set());
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  // quiz state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [answerState, setAnswerState] = useState<'unanswered' | 'selected' | 'revealed'>('unanswered');

  // results
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // error
  const [error, setError] = useState<string | null>(null);

  // operating hours
  const [hoursInfo, setHoursInfo] = useState<{ isOpen: boolean; message: string } | null>(null);

  // Auth guard
  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.replace('/login');
    }
  }, [initialized, authLoading, user, router]);

  // Operating hours check
  useEffect(() => {
    getOperatingHoursInfo().then((info) => {
      setHoursInfo({ isOpen: info.isOpen, message: info.message });
    }).catch(() => {});
  }, []);

  // Loading message rotation
  useEffect(() => {
    if (phase !== 'loading') return;
    const interval = setInterval(() => {
      setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [phase]);

  // Toggle discipline
  const toggleDiscipline = (d: Discipline) => {
    setSelectedDisciplines((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else if (next.size < 5) next.add(d);
      return next;
    });
  };

  // Start quiz
  const startQuiz = useCallback(async () => {
    if (selectedDisciplines.size === 0) return;
    setPhase('loading');
    setError(null);
    setLoadingMsgIndex(0);

    try {
      const params = Array.from(selectedDisciplines).join(',');
      const res = await fetch(`/api/questoes?disciplines=${encodeURIComponent(params)}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Erro ao gerar questões');
      }
      const data = await res.json();
      if (!data.questions?.length || typeof data.attemptId !== 'string') {
        throw new Error('Não foi possível iniciar o simulado');
      }

      setQuestions(data.questions);
      setAttemptId(data.attemptId);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setAnswerState('unanswered');
      setSaveStatus('idle');
      setSaveError(null);
      setPhase('quiz');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar questões');
      setPhase('setup');
    }
  }, [selectedDisciplines]);

  // Select answer
  const handleSelectAnswer = (altId: string) => {
    if (answerState === 'revealed') return;
    const q = questions[currentIndex];
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: altId }));
    setAnswerState('selected');
  };

  // Confirm answer (reveal)
  const handleConfirm = () => {
    setAnswerState('revealed');
  };

  const saveQuizResult = useCallback(async () => {
    if (!attemptId) {
      setSaveStatus('error');
      setSaveError('A tentativa não foi encontrada. Inicie um novo simulado.');
      return;
    }

    setSaveStatus('saving');
    setSaveError(null);

    try {
      const response = await fetch('/api/questoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, selectedAnswers }),
      });
      const payload = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(payload.error || 'Não foi possível salvar o resultado.');
      }

      setSaveStatus('saved');
    } catch (saveFailure) {
      setSaveStatus('error');
      setSaveError(
        saveFailure instanceof Error
          ? saveFailure.message
          : 'Não foi possível salvar o resultado.'
      );
    }
  }, [attemptId, selectedAnswers]);

  // Next question / finish
  const handleNext = useCallback(async () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setAnswerState('unanswered');
    } else {
      // Calculate results
      let correct = 0;
      let wrong = 0;
      let unanswered = 0;
      const questionResults: QuizResult['questionResults'] = [];

      for (const q of questions) {
        const selected = selectedAnswers[q.id];
        const correctAlt = q.alternatives.find((a) => a.isCorrect);
        if (!selected) {
          unanswered++;
          questionResults.push({
            questionId: q.id,
            isCorrect: false,
            correctAlternativeId: correctAlt?.id || '',
          });
        } else {
          const isRight = q.alternatives.find((a) => a.id === selected)?.isCorrect ?? false;
          if (isRight) correct++;
          else wrong++;
          questionResults.push({
            questionId: q.id,
            isCorrect: isRight,
            selectedAlternativeId: selected,
            correctAlternativeId: correctAlt?.id || '',
          });
        }
      }

      const total = questions.length;
      const score = total > 0 ? Math.round((correct / total) * 100) : 0;
      const result: QuizResult = {
        totalQuestions: total,
        correctAnswers: correct,
        wrongAnswers: wrong,
        unansweredQuestions: unanswered,
        score,
        questionResults,
      };

      setQuizResult(result);
      setPhase('results');
      void saveQuizResult();
    }
  }, [currentIndex, questions, selectedAnswers, saveQuizResult]);

  // Reset
  const handleNewQuiz = () => {
    setPhase('setup');
    setQuestions([]);
    setCurrentIndex(0);
    setSelectedAnswers({});
    setAnswerState('unanswered');
    setQuizResult(null);
    setAttemptId(null);
    setSaveStatus('idle');
    setSaveError(null);
    setError(null);
  };

  // -------------------------------------------------------------------------
  // Render guards
  // -------------------------------------------------------------------------
  if (authLoading || !initialized) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-64 rounded bg-[var(--surface)]" />
        <div className="h-4 w-96 rounded bg-[var(--surface)]" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      </div>
    );
  }
  if (!user) return null;

  // -------------------------------------------------------------------------
  // SETUP SCREEN
  // -------------------------------------------------------------------------
  if (phase === 'setup') {
    const totalQuestions = selectedDisciplines.size * QUESTIONS_PER_DISCIPLINE;

    return (
      <div className="min-h-[80vh] pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
          {/* header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-3)]">
              <span className="text-[var(--brand)]">✦</span>
              Simulado com IA
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
              Simulado inteligente de questões
            </h1>
            <p className="text-[var(--text-3)] max-w-lg">
              Escolha as disciplinas e receba um simulado inteligente com banco próprio de questões
              e novas gerações no estilo ENEM, sempre com explicações comentadas.
            </p>
          </motion.div>

          {/* operating hours */}
          {hoursInfo && (
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
              hoursInfo.isOpen
                ? 'bg-[var(--ai)]/10 text-[var(--ai)] border border-[var(--ai)]/20'
                : 'bg-[var(--warning)]/10 text-[var(--warning)] border border-[var(--warning)]/20'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${hoursInfo.isOpen ? 'bg-[var(--ai)]' : 'bg-[var(--warning)]'}`} />
              {hoursInfo.isOpen ? 'Sistema disponível' : hoursInfo.message}
            </div>
          )}

          {/* info cards */}
          <motion.div
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {[
              { label: '3 questões', sub: 'por disciplina', icon: '📝' },
              { label: '20 min', sub: 'tempo sugerido', icon: '⏱️' },
              { label: 'Banco inteligente', sub: 'menos repetição', icon: '🧠' },
            ].map((info) => (
              <div
                key={info.label}
                className="text-center p-3 rounded-xl border border-[var(--border)] bg-[var(--surface)]"
              >
                <span className="text-xl">{info.icon}</span>
                <p className="text-sm font-semibold text-[var(--text)] mt-1">{info.label}</p>
                <p className="text-xs text-[var(--text-3)]">{info.sub}</p>
              </div>
            ))}
          </motion.div>

          {/* discipline grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <h2 className="text-sm font-bold text-[var(--text)] mb-3">
              Escolha suas disciplinas
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {DISCIPLINES.map((d) => {
                const isSelected = selectedDisciplines.has(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDiscipline(d.id)}
                    className={`relative text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'border-[var(--brand)] bg-[var(--brand)]/10 ring-1 ring-[var(--brand)]/30'
                        : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]'
                    }`}
                  >
                    {isSelected && (
                      <span className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[var(--brand)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </span>
                    )}
                    <span className="text-2xl">{d.icon}</span>
                    <p className="text-sm font-semibold text-[var(--text)] mt-2">{d.label}</p>
                    <p className="text-xs text-[var(--text-3)] mt-0.5">{d.description}</p>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* summary + start */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {selectedDisciplines.size > 0 && (
              <p className="text-sm text-[var(--text-3)]">
                <span className="font-semibold text-[var(--text)]">{selectedDisciplines.size}</span>
                {' '}disciplina{selectedDisciplines.size > 1 ? 's' : ''} •{' '}
                <span className="font-semibold text-[var(--text)]">{totalQuestions}</span>
                {' '}questões serão preparadas
              </p>
            )}

            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-sm text-[var(--danger)]">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                {error}
              </div>
            )}

            <button
              onClick={startQuiz}
              disabled={selectedDisciplines.size === 0 || (hoursInfo !== null && !hoursInfo.isOpen)}
              className="w-full sm:w-auto px-8 py-3 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Iniciar simulado
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // LOADING SCREEN
  // -------------------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg)]/95 backdrop-blur-sm">
        <div className="text-center space-y-6 px-4">
          {/* spinner */}
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-[var(--border)]" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--brand)] animate-spin" />
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={loadingMsgIndex}
              className="text-[var(--text)] font-medium"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
            >
              {LOADING_MESSAGES[loadingMsgIndex]}
            </motion.p>
          </AnimatePresence>

          {/* discipline pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {Array.from(selectedDisciplines).map((d) => (
              <span
                key={d}
                className="px-3 py-1 rounded-full text-xs font-medium border border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)]"
              >
                {d}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // QUIZ SCREEN
  // -------------------------------------------------------------------------
  if (phase === 'quiz' && questions.length > 0) {
    const currentQ = questions[currentIndex];
    return (
      <div className="min-h-[80vh] pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
          <AnimatePresence mode="wait">
            <QuestionCard
              key={currentQ.id}
              question={currentQ}
              questionIndex={currentIndex}
              totalQuestions={questions.length}
              selectedAnswer={selectedAnswers[currentQ.id] || null}
              answerState={answerState}
              onSelectAnswer={handleSelectAnswer}
              onConfirm={handleConfirm}
              onNext={handleNext}
            />
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // RESULTS SCREEN
  // -------------------------------------------------------------------------
  if (phase === 'results' && quizResult) {
    return (
      <div className="min-h-[80vh] pb-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div
            aria-live="polite"
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${
              saveStatus === 'error'
                ? 'border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]'
                : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-3)]'
            }`}
          >
            {saveStatus === 'saving' && 'Salvando seu resultado...'}
            {saveStatus === 'saved' && 'Resultado salvo no seu histórico.'}
            {saveStatus === 'error' && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{saveError}</span>
                <button
                  type="button"
                  onClick={() => void saveQuizResult()}
                  className="rounded-md border border-current px-3 py-1.5 font-medium transition-opacity hover:opacity-80"
                >
                  Tentar salvar novamente
                </button>
              </div>
            )}
          </div>
          <QuizResults
            result={quizResult}
            questions={questions}
            selectedAnswers={selectedAnswers}
            onNewQuiz={handleNewQuiz}
          />
        </div>
      </div>
    );
  }

  return null;
}
