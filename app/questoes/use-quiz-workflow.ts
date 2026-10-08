'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError, failureMessage } from '@/lib/client/api-errors';
import { useOperatingHours } from '@/lib/client/use-operating-hours';
import { useRetryDelay } from '@/lib/client/use-retry-delay';
import { useUserDraft } from '@/lib/client/use-user-draft';
import type { OperatingHoursInfo } from '@/lib/contracts/operating-hours';
import type { Discipline, QuizResult } from '@/lib/contracts/quiz';
import { EMPTY_QUIZ_DRAFT, freezeQuizSubmission, quizDraftSchema } from '@/lib/contracts/student-drafts';
import { requestQuizAttempt, requestQuizResult } from './quiz-api';

export function useQuizWorkflow(userId: string, initialHours: OperatingHoursInfo) {
  const { draft, updateDraft, clearDraft, ready, status } = useUserDraft('quiz', userId, quizDraftSchema, EMPTY_QUIZ_DRAFT);
  const operatingHours = useOperatingHours(initialHours, userId);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [confirmIncomplete, setConfirmIncomplete] = useState(false);
  const secondsToRetry = useRetryDelay(retryAt);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => () => requestRef.current?.abort(), []);

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
      const attempt = await requestQuizAttempt(requestId, draft.disciplines, controller.signal);
      if (controller.signal.aborted) return;
      updateDraft((current) => ({ ...current, attempt, currentIndex: 0, selectedAnswers: {}, submission: null, expired: false }));
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
    // Persist the first answer snapshot before fetch; manual retries reuse it.
    updateDraft((current) => ({ ...current, submission }));
    const controller = new AbortController();
    requestRef.current = controller;
    setSubmitting(true);
    setConfirmIncomplete(false);
    setError(null);
    try {
      const quizResult = await requestQuizResult(submission, controller.signal);
      if (controller.signal.aborted) return;
      setResult(quizResult);
      clearDraft();
    } catch (failure) {
      if (controller.signal.aborted) return;
      if (failure instanceof ApiError && failure.kind === 'expired') {
        updateDraft((current) => ({ ...current, expired: true }));
      }
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

  const moveTo = (index: number) => {
    updateDraft((current) => ({ ...current, currentIndex: index }));
    setConfirmIncomplete(false);
  };

  const questions = draft.attempt?.questions ?? [];
  const answered = questions.filter((question) => draft.selectedAnswers[question.id]).length;
  const missing = questions.length - answered;
  const next = () => {
    if (draft.currentIndex < questions.length - 1) moveTo(draft.currentIndex + 1);
    else if (missing && !draft.submission) setConfirmIncomplete(true);
    else void finishQuiz();
  };

  const selectAnswer = (questionId: string, alternativeId: string) => {
    updateDraft((current) => ({ ...current, selectedAnswers: { ...current.selectedAnswers, [questionId]: alternativeId } }));
  };

  return {
    draft, ready, operatingHours, loading, submitting, result, error,
    secondsToRetry, confirmIncomplete, questions, answered, missing,
    storageWarning: status === 'unavailable' || status === 'invalid' || status === 'stopped',
    toggleDiscipline, startQuiz, finishQuiz, reset, moveTo, next, selectAnswer,
  };
}
