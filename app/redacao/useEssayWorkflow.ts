'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  essayCorrectionResponseSchema,
  generatedThemeResponseSchema,
} from '@/lib/contracts/essay';

export type ThemeData = {
  themeId: string;
  tema: string;
  textoApoio1: string;
  textoApoio2: string;
};

export type ThemeMode = 'generated' | 'manual';
export type MobileTab = 'theme' | 'write' | 'submit';

export const MIN_WORDS = 100;
export const MAX_WORDS = 500;

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function useEssayWorkflow() {
  const router = useRouter();
  const submissionRef = useRef<{ id: string; inputKey: string } | null>(null);
  const [themeMode, setThemeMode] = useState<ThemeMode>('generated');
  const [theme, setTheme] = useState<ThemeData | null>(null);
  const [themeLoading, setThemeLoading] = useState(false);
  const [themeError, setThemeError] = useState('');
  const [manualTheme, setManualTheme] = useState('');
  const [essay, setEssay] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [correctionError, setCorrectionError] = useState('');
  const [mobileTab, setMobileTab] = useState<MobileTab>('theme');

  const wordCount = countWords(essay);
  const selectedThemeTitle = themeMode === 'manual' ? manualTheme.trim() : theme?.tema ?? '';
  const hasSelectedTheme = selectedThemeTitle.length >= 5;
  const canSubmit =
    hasSelectedTheme && wordCount >= MIN_WORDS && wordCount <= MAX_WORDS && !correcting;

  const generateTheme = useCallback(async () => {
    setThemeLoading(true);
    setThemeError('');
    try {
      const response = await fetch('/api/gerar-tema', { method: 'POST' });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : 'Erro ao gerar tema.';
        throw new Error(message);
      }

      const validated = generatedThemeResponseSchema.safeParse(payload);
      if (!validated.success) throw new Error('O servidor retornou um tema inválido.');
      setTheme(validated.data);
      setThemeMode('generated');
      setMobileTab('write');
    } catch (error) {
      setThemeError(error instanceof Error ? error.message : 'Erro ao gerar tema. Tente novamente.');
    } finally {
      setThemeLoading(false);
    }
  }, []);

  const submitEssay = useCallback(async () => {
    if (!canSubmit) return;
    setCorrecting(true);
    setCorrectionError('');

    try {
      const themePayload = themeMode === 'manual'
        ? { mode: 'manual' as const, tema: manualTheme.trim() }
        : { mode: 'generated' as const, id: theme?.themeId ?? '' };
      const inputKey = JSON.stringify({ essay, theme: themePayload });
      if (!submissionRef.current || submissionRef.current.inputKey !== inputKey) {
        submissionRef.current = { id: crypto.randomUUID(), inputKey };
      }

      const response = await fetch('/api/corrigir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: submissionRef.current.id,
          redacao: essay,
          theme: themePayload,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : 'Erro ao corrigir redação.';
        throw new Error(message);
      }

      const validated = essayCorrectionResponseSchema.safeParse(payload);
      if (!validated.success) throw new Error('O servidor retornou uma correção inválida.');
      submissionRef.current = null;
      router.push(`/resultados/${validated.data.id}`);
    } catch (error) {
      setCorrectionError(error instanceof Error ? error.message : 'Erro ao corrigir. Tente novamente.');
      setCorrecting(false);
    }
  }, [canSubmit, essay, manualTheme, router, theme, themeMode]);

  return {
    themeMode,
    setThemeMode,
    theme,
    themeLoading,
    themeError,
    setThemeError,
    manualTheme,
    setManualTheme,
    essay,
    setEssay,
    correcting,
    correctionError,
    mobileTab,
    setMobileTab,
    wordCount,
    charCount: essay.length,
    selectedThemeTitle,
    hasSelectedTheme,
    canSubmit,
    generateTheme,
    submitEssay,
  };
}
