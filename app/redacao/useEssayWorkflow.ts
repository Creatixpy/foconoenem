'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { essayCorrectionResponseSchema, generatedThemeResponseSchema } from '@/lib/contracts/essay';
import { EMPTY_ESSAY_DRAFT, essayDraftSchema, type EssayDraft } from '@/lib/contracts/student-drafts';
import { countWords, essayValidation, manualThemeValidation } from '@/lib/contracts/essay-input';
import { useUserDraft } from '@/lib/client/use-user-draft';
import { ApiError, apiError, failureMessage } from '@/lib/client/api-errors';
import { useRetryDelay } from '@/lib/client/use-retry-delay';

export { MIN_WORDS, MAX_WORDS, MAX_ESSAY_CHARACTERS } from '@/lib/contracts/essay-input';

export function useEssayWorkflow(userId: string) {
  const router = useRouter();
  const { draft, updateDraft, clearDraft, ready, status, savedAt } = useUserDraft('essay', userId, essayDraftSchema, EMPTY_ESSAY_DRAFT);
  const generationRef = useRef<AbortController | null>(null);
  const correctionRef = useRef<AbortController | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState('');
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [themeRetryAt, setThemeRetryAt] = useState<number | null>(null);
  const secondsToRetry = useRetryDelay(retryAt);
  const themeSecondsToRetry = useRetryDelay(themeRetryAt);

  useEffect(() => () => { generationRef.current?.abort(); correctionRef.current?.abort(); }, []);

  const setThemeMode = useCallback((mode: EssayDraft['themeMode']) => {
    if (correctionRef.current) return;
    generationRef.current?.abort();
    generationRef.current = null;
    setThemeLoading(false);
    setThemeError('');
    updateDraft((current) => ({ ...current, themeMode: mode }));
  }, [updateDraft]);
  const setManualTheme = useCallback((value: string) => {
    if (!correctionRef.current) updateDraft((current) => ({ ...current, manualTheme: value }));
  }, [updateDraft]);
  const setEssay = useCallback((value: string) => {
    if (!correctionRef.current) updateDraft((current) => ({ ...current, essay: value }));
  }, [updateDraft]);
  const discardDraft = useCallback(() => {
    if (correctionRef.current) return;
    generationRef.current?.abort();
    generationRef.current = null;
    setThemeLoading(false);
    setThemeError('');
    setCorrectionError('');
    clearDraft();
  }, [clearDraft]);

  const wordCount = countWords(draft.essay);
  const selectedThemeTitle = draft.themeMode === 'manual' ? draft.manualTheme.trim() : draft.theme?.tema ?? '';
  const themeValidation = draft.themeMode === 'manual' ? manualThemeValidation(draft.manualTheme) : '';
  const hasSelectedTheme = draft.themeMode === 'manual' ? !themeValidation : !!draft.theme;
  const inputValidation = essayValidation(draft.essay);
  const canSubmit = ready && hasSelectedTheme && !inputValidation && !correcting && !themeLoading && secondsToRetry === 0;

  const generateTheme = useCallback(async () => {
    if (!ready || generationRef.current || correctionRef.current || themeSecondsToRetry) return false;
    const controller = new AbortController();
    generationRef.current = controller;
    setThemeLoading(true);
    setThemeError('');
    try {
      const response = await fetch('/api/gerar-tema', { method: 'POST', signal: controller.signal });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw apiError(response, payload, 'Não foi possível gerar o tema agora. Tente novamente em instantes.');
      const validated = generatedThemeResponseSchema.safeParse(payload);
      if (!validated.success) throw new ApiError('Não conseguimos abrir o tema. Tente gerar novamente.', 'unavailable');
      if (controller.signal.aborted || generationRef.current !== controller) return false;
      updateDraft((current) => ({ ...current, theme: validated.data, themeMode: 'generated' }));
      return true;
    } catch (failure) {
      if (controller.signal.aborted || generationRef.current !== controller) return false;
      setThemeError(failureMessage(failure));
      setThemeRetryAt(failure instanceof ApiError ? failure.retryAt : null);
      return false;
    } finally {
      if (generationRef.current === controller) {
        generationRef.current = null;
        setThemeLoading(false);
      }
    }
  }, [ready, themeSecondsToRetry, updateDraft]);

  const submitEssay = useCallback(async () => {
    if (!canSubmit || correctionRef.current) return;
    const themePayload = draft.themeMode === 'manual'
      ? { mode: 'manual' as const, tema: draft.manualTheme.trim() }
      : { mode: 'generated' as const, id: draft.theme?.themeId ?? '' };
    const inputKey = JSON.stringify({ essay: draft.essay, theme: themePayload });
    const submission = draft.submission?.inputKey === inputKey ? draft.submission : { id: crypto.randomUUID(), inputKey };
    updateDraft((current) => ({ ...current, submission }));
    const controller = new AbortController();
    correctionRef.current = controller;
    setCorrecting(true);
    setCorrectionError('');
    try {
      const response = await fetch('/api/corrigir', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: controller.signal,
        body: JSON.stringify({ submissionId: submission.id, redacao: draft.essay, theme: themePayload }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) throw apiError(response, payload, 'Não foi possível concluir a correção. Sua redação foi mantida. Tente novamente em instantes.');
      const validated = essayCorrectionResponseSchema.safeParse(payload);
      if (!validated.success) throw new ApiError('Não conseguimos abrir a correção. Envie novamente para recuperar o resultado.', 'unavailable');
      if (controller.signal.aborted) return;
      clearDraft();
      router.push(`/resultados/${validated.data.id}`);
    } catch (failure) {
      if (controller.signal.aborted) return;
      const message = failureMessage(failure);
      setCorrectionError(failure instanceof ApiError ? message : `${message} Sua redação foi mantida.`);
      setRetryAt(failure instanceof ApiError ? failure.retryAt : null);
      setCorrecting(false);
    } finally {
      if (correctionRef.current === controller) correctionRef.current = null;
    }
  }, [canSubmit, draft, updateDraft, clearDraft, router]);

  return {
    ...draft, ready, draftStatus: status, savedAt, discardDraft,
    setThemeMode, themeLoading, themeError, setManualTheme, setEssay,
    correcting, correctionError, wordCount, charCount: draft.essay.length,
    selectedThemeTitle, hasSelectedTheme, canSubmit, themeValidation, inputValidation,
    secondsToRetry, themeSecondsToRetry, generateTheme, submitEssay,
  };
}
