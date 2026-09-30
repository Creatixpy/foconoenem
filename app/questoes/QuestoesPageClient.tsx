'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import { DISCIPLINES, quizAttemptResponseSchema, quizResultSchema, type Discipline, type QuizResult } from '@/lib/contracts/quiz';
import { EMPTY_QUIZ_DRAFT, freezeQuizSubmission, quizDraftSchema } from '@/lib/contracts/student-drafts';
import { useUserDraft } from '@/lib/client/use-user-draft';
import { useOperatingHours } from '@/lib/client/use-operating-hours';
import { useRetryDelay } from '@/lib/client/use-retry-delay';
import { ApiError, apiError, failureMessage } from '@/lib/client/api-errors';
import FlowStatus from '@/app/components/shared/FlowStatus';
import QuestionCard from '@/app/components/features/quiz/QuestionCard';
import QuizResults from '@/app/components/features/quiz/QuizResults';

const DISCIPLINE_DETAILS: Record<Discipline, { description: string; icon: string }> = {
  Matemática: { description: 'Álgebra, geometria e estatística', icon: '📐' },
  Português: { description: 'Interpretação, gramática e literatura', icon: '📖' },
  Química: { description: 'Química geral, orgânica e físico-química', icon: '🧪' },
  Física: { description: 'Mecânica, termodinâmica e óptica', icon: '⚡' },
  Geografia: { description: 'Brasil, mundo e geopolítica', icon: '🌎' },
};

function QuizWorkflow({ userId, initialHours }: { userId: string; initialHours: OperatingHoursInfo }) {
  const { draft, updateDraft, clearDraft, ready, status } = useUserDraft('quiz', userId, quizDraftSchema, EMPTY_QUIZ_DRAFT);
  const operatingHours = useOperatingHours(initialHours);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);
  const secondsToRetry = useRetryDelay(retryAt);
  const requestRef = useRef<AbortController | null>(null);
  const confirmationRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => requestRef.current?.abort(), []);
  useEffect(() => { if (confirmIncomplete) confirmationRef.current?.focus(); }, [confirmIncomplete]);

  const toggleDiscipline = (discipline: Discipline) => {
    updateDraft((current) => ({
      ...current,
      disciplines: current.disciplines.includes(discipline)
        ? current.disciplines.filter((item) => item !== discipline)
        : [...current.disciplines, discipline],
      requestId: null,
    }));
    setError(null);
  };

  const startQuiz = async () => {
    if (!ready || !draft.disciplines.length || requestRef.current || secondsToRetry) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setLoading(true);
    setError(null);
    const requestId = draft.requestId ?? crypto.randomUUID();
    updateDraft((current) => ({ ...current, requestId }));
    try {
      const response = await fetch('/api/questoes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ requestId, disciplines: [...draft.disciplines].sort() }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw apiError(response, payload, 'Não foi possível preparar o simulado. Tente novamente em instantes.');
      const validated = quizAttemptResponseSchema.safeParse(payload);
      if (!validated.success) throw new ApiError('Não conseguimos abrir o simulado. Tente novamente para recuperar a mesma tentativa.', 'unavailable');
      if (controller.signal.aborted) return;
      updateDraft((current) => ({ ...current, attempt: validated.data, currentIndex: 0, selectedAnswers: {}, submission: null, expired: false }));
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failureMessage(failure));
      setRetryAt(failure instanceof ApiError ? failure.retryAt : null);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const finishQuiz = async () => {
    if (requestRef.current || draft.expired || secondsToRetry) return;
    const submission = freezeQuizSubmission(draft);
    if (!submission) return;
    // Persist the exact first submission before fetch. Manual retries reuse it even after reload.
    updateDraft((current) => ({ ...current, submission }));
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitting(true);
    setConfirmIncomplete(false);
    setError(null);
    try {
      const response = await fetch('/api/questoes', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify(submission),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 404 || response.status === 410) {
          updateDraft((current) => ({ ...current, expired: true }));
          throw new ApiError('Este simulado expirou ou não está mais disponível. Comece um novo simulado.', 'expired');
        }
        throw apiError(response, payload, 'Não foi possível confirmar o resultado. Suas respostas foram mantidas para tentar finalizar novamente.');
      }
      const validated = quizResultSchema.safeParse(payload && typeof payload === 'object' && 'result' in payload ? payload.result : null);
      if (!validated.success) throw new ApiError('Não conseguimos abrir seu resultado. Tente finalizar novamente para recuperá-lo.', 'unavailable');
      if (controller.signal.aborted) return;
      setResult(validated.data);
      clearDraft();
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failureMessage(failure, 'Não foi possível conectar. Suas respostas foram mantidas. Tente finalizar novamente.'));
      setRetryAt(failure instanceof ApiError ? failure.retryAt : null);
    } finally {
      if (!controller.signal.aborted) setSubmitting(false);
      if (requestRef.current === controller) requestRef.current = null;
    }
  };

  const reset = () => {
    clearDraft();
    setResult(null);
    setError(null);
    setRetryAt(null);
    setConfirmIncomplete(false);
  };
  const storageWarning = status === 'unavailable' || status === 'invalid' || status === 'stopped';
  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-10"><FlowStatus>Recuperando seu simulado…</FlowStatus></div>;
  if (result) return <div className="student-flow min-h-[80vh] px-4 py-10 sm:px-6"><QuizResults result={result} onNewQuiz={reset} /></div>;
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center px-4"><FlowStatus>Preparando seu simulado…</FlowStatus></div>;

  if (draft.attempt) {
    const questions = draft.attempt.questions;
    const answered = questions.filter((question) => draft.selectedAnswers[question.id]).length;
    const missing = questions.length - answered;
    const question = questions[draft.currentIndex];
    const moveTo = (index: number) => {
      updateDraft((current) => ({ ...current, currentIndex: index }));
      setConfirmIncomplete(false);
    };
    const next = () => {
      if (draft.currentIndex < questions.length - 1) moveTo(draft.currentIndex + 1);
      else if (missing && !draft.submission) setConfirmIncomplete(true);
      else void finishQuiz();
    };
    return (
      <div className="student-flow min-h-[80vh] px-4 py-8 sm:px-6">
        <div className="mx-auto mb-4 max-w-3xl space-y-3">
          <p className="text-sm text-[var(--text-2)]">{answered} de {questions.length} questões respondidas</p>
          {storageWarning && <FlowStatus>Não conseguimos salvar nesta aba. Mantenha a página aberta para preservar suas respostas.</FlowStatus>}
          {draft.submission && !draft.expired && !submitting && <FlowStatus>As respostas do envio foram mantidas. Tente finalizar novamente para recuperar seu resultado.</FlowStatus>}
          {(error || draft.expired) && <FlowStatus error>{error || 'Este simulado expirou ou não está mais disponível. Comece um novo simulado.'}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>}
          {draft.expired && <button type="button" onClick={reset} className="rounded-lg bg-[var(--brand)] px-6 py-3 font-medium text-white">Novo simulado</button>}
        </div>
        <QuestionCard
          key={question.id} question={question} questionIndex={draft.currentIndex} totalQuestions={questions.length}
          selectedAnswer={draft.selectedAnswers[question.id] ?? null} locked={submitting || !!draft.submission || draft.expired}
          submitting={submitting} finishDisabled={draft.expired || secondsToRetry > 0} retrying={!!draft.submission}
          onSelectAnswer={(alternativeId) => updateDraft((current) => ({ ...current, selectedAnswers: { ...current.selectedAnswers, [question.id]: alternativeId } }))}
          onPrevious={() => moveTo(draft.currentIndex - 1)} onNext={next}
        />
        {confirmIncomplete && (
          <div ref={confirmationRef} tabIndex={-1} className="mx-auto mt-5 max-w-3xl rounded-xl border border-[var(--warning)]/40 bg-[var(--warning-soft)] p-4" role="group" aria-labelledby="incomplete-title">
            <h2 id="incomplete-title" className="text-base font-semibold text-[var(--text)]">Há {missing} {missing !== 1 ? 'questões' : 'questão'} sem resposta</h2>
            <p className="mt-2 text-sm text-[var(--text-2)]">Você pode revisar ou finalizar com essas questões em branco.</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={() => moveTo(questions.findIndex((item) => !draft.selectedAnswers[item.id]))} className="rounded-lg border border-[var(--border-hover)] px-5 py-3 text-sm text-[var(--text)]">Revisar</button>
              <button type="button" onClick={() => void finishQuiz()} className="rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white">Finalizar mesmo assim</button>
            </div>
          </div>
        )}
        {submitting && <div className="mx-auto mt-4 max-w-3xl"><FlowStatus>Finalizando e salvando seu resultado…</FlowStatus></div>}
      </div>
    );
  }

  return (
    <div className="student-flow mx-auto min-h-[80vh] max-w-3xl space-y-8 px-4 py-10 sm:px-6">
      <header className="space-y-3">
        <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-2)]">✦ Simulado com IA</span>
        <h1 className="text-3xl font-bold text-[var(--text)]">Simulado inteligente</h1>
        <p className="max-w-xl text-[var(--text-3)]">Escolha as disciplinas e pratique no seu ritmo. Ao finalizar, confira seu resultado e a explicação de cada questão.</p>
        <p className={`text-sm ${operatingHours.isOpen ? 'text-[var(--ai)]' : 'text-[var(--warning)]'}`}>{operatingHours.isOpen ? 'Sistema disponível' : operatingHours.message}</p>
      </header>
      <section>
        <h2 className="mb-3 text-sm font-bold text-[var(--text)]">Escolha as disciplinas</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {DISCIPLINES.map((discipline) => {
            const selected = draft.disciplines.includes(discipline);
            const detail = DISCIPLINE_DETAILS[discipline];
            return <button key={discipline} type="button" aria-pressed={selected} onClick={() => toggleDiscipline(discipline)} className={`rounded-xl border p-4 text-left transition-colors ${selected ? 'border-[var(--brand-hover)] bg-[var(--brand)]/10' : 'border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)]'}`}>
              <span className="text-2xl" aria-hidden="true">{detail.icon}</span>
              <span className="mt-2 block text-sm font-semibold text-[var(--text)]">{discipline}{selected ? ' ✓' : ''}</span>
              <span className="mt-0.5 block text-xs text-[var(--text-3)]">{detail.description}</span>
            </button>;
          })}
        </div>
      </section>
      {storageWarning && <FlowStatus>O salvamento nesta aba está indisponível. Mantenha a página aberta durante o simulado.</FlowStatus>}
      {error && <FlowStatus error>{error}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>}
      <button type="button" onClick={() => void startQuiz()} disabled={!draft.disciplines.length || !operatingHours.isOpen || secondsToRetry > 0} className="rounded-lg bg-[var(--brand)] px-8 py-3 font-medium text-white hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50">
        {draft.requestId ? 'Retomar preparação do simulado' : 'Iniciar simulado'}
      </button>
    </div>
  );
}

export default function QuestoesPageClient({ operatingHours }: { operatingHours: OperatingHoursInfo }) {
  const { user } = useAuth();
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-10"><FlowStatus>Entre novamente para recuperar seu simulado. <Link href="/login" className="underline">Entrar</Link></FlowStatus></div>;
  return <QuizWorkflow key={user.id} userId={user.id} initialHours={operatingHours} />;
}
