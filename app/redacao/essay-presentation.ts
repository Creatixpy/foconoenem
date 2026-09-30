import { MAX_ESSAY_CHARACTERS, MAX_WORDS, MIN_WORDS } from '@/lib/contracts/essay-input';
import type { EssayDraft } from '@/lib/contracts/student-drafts';

export type RequirementState = 'pending' | 'met' | 'violated';
export type WordCountState = 'pending' | 'met' | 'near-limit' | 'violated';

export function wordCountState(words: number): WordCountState {
  if (words > MAX_WORDS) return 'violated';
  if (words >= 450) return 'near-limit';
  return words >= MIN_WORDS ? 'met' : 'pending';
}

export function wordRequirementState(words: number): RequirementState {
  if (words > MAX_WORDS) return 'violated';
  return words >= MIN_WORDS ? 'met' : 'pending';
}

export function themeRequirementState(hasTheme: boolean, manualTheme: string, validation: string): RequirementState {
  if (hasTheme) return 'met';
  return manualTheme.trim() && validation ? 'violated' : 'pending';
}

export function hasMeaningfulEssayDraft(draft: Pick<EssayDraft, 'essay' | 'manualTheme' | 'theme'>): boolean {
  return Boolean(draft.essay.trim() || draft.manualTheme.trim() || draft.theme);
}

export function essaySubmitReason({
  correcting, themeLoading, secondsToRetry, isOpen, hasTheme, themeValidation, words, characters,
}: {
  correcting: boolean; themeLoading: boolean; secondsToRetry: number; isOpen: boolean;
  hasTheme: boolean; themeValidation: string; words: number; characters: number;
}): string {
  if (correcting) return 'Correção em andamento. Aguarde nesta página.';
  if (themeLoading) return 'Aguarde a geração do tema para enviar.';
  if (secondsToRetry > 0) return `Aguarde ${secondsToRetry}s para tentar novamente.`;
  if (!isOpen) return 'Correções disponíveis das 7h às 23h30, no horário de Brasília.';
  if (!hasTheme) return themeValidation || 'Escolha um tema com IA ou escreva seu tema para enviar.';
  if (characters > MAX_ESSAY_CHARACTERS) return 'Revise a redação: o limite é de 5.000 caracteres.';
  if (words > MAX_WORDS) return `Revise a redação: retire ${words - MAX_WORDS} ${words - MAX_WORDS === 1 ? 'palavra' : 'palavras'} para enviar.`;
  if (words < MIN_WORDS) return `Faltam ${MIN_WORDS - words} ${MIN_WORDS - words === 1 ? 'palavra' : 'palavras'} para enviar.`;
  return '';
}
