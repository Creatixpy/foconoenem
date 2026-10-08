'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import { DISCIPLINES, type Discipline } from '@/lib/contracts/quiz';
import FlowStatus from '@/app/components/shared/FlowStatus';
import QuestionCard from '@/app/components/features/quiz/QuestionCard';
import QuizResults from '@/app/components/features/quiz/QuizResults';
import { useQuizWorkflow } from './use-quiz-workflow';

const DISCIPLINE_DETAILS: Record<Discipline, { description: string; icon: string }> = {
  Matemática: { description: 'Álgebra, geometria e estatística', icon: '📐' },
  Português: { description: 'Interpretação, gramática e literatura', icon: '📖' },
  Química: { description: 'Química geral, orgânica e físico-química', icon: '🧪' },
  Física: { description: 'Mecânica, termodinâmica e óptica', icon: '⚡' },
  Geografia: { description: 'Brasil, mundo e geopolítica', icon: '🌎' },
};

function QuizWorkflow({ userId, initialHours }: { userId: string; initialHours: OperatingHoursInfo }) {
  const {
    draft, ready, operatingHours, loading, submitting, result, error,
    secondsToRetry, confirmIncomplete, questions, answered, missing, storageWarning,
    toggleDiscipline, startQuiz, finishQuiz, reset, moveTo, next, selectAnswer,
  } = useQuizWorkflow(userId, initialHours);
  const confirmationRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (confirmIncomplete) confirmationRef.current?.focus(); }, [confirmIncomplete]);

  if (!ready) return <div className="mx-auto max-w-3xl px-4 py-10"><FlowStatus>Recuperando seu simulado…</FlowStatus></div>;
  if (result) return <div className="student-flow min-h-[80vh] px-4 py-10 sm:px-6"><QuizResults result={result} onNewQuiz={reset} /></div>;
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center px-4"><FlowStatus>Preparando seu simulado…</FlowStatus></div>;

  if (draft.attempt) {
    const question = questions[draft.currentIndex];
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
          onSelectAnswer={(alternativeId) => selectAnswer(question.id, alternativeId)}
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
        <p className={`text-sm ${operatingHours.isOpen ? 'text-[var(--ai)]' : 'text-[var(--warning)]'}`}>{operatingHours.unrestrictedAccess ? 'Max disponível 24 horas' : operatingHours.isOpen ? 'Sistema disponível' : operatingHours.message}</p>
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
