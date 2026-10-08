import { MAX_ESSAY_CHARACTERS, MAX_WORDS, MIN_WORDS } from '@/lib/contracts/essay-input';
import type { EssayDraft } from '@/lib/contracts/student-drafts';
import type { DraftStatus } from '@/lib/client/drafts';

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

export function essaySubmitLabel({
  correcting, themeLoading, secondsToRetry, isOpen, hasTheme, themeMode, manualTheme, words, characters,
}: {
  correcting: boolean; themeLoading: boolean; secondsToRetry: number; isOpen: boolean;
  hasTheme: boolean; themeMode: EssayDraft['themeMode']; manualTheme: string; words: number; characters: number;
}): string {
  if (correcting) return 'Corrigindo…';
  if (themeLoading) return 'Preparando tema…';
  if (secondsToRetry > 0) return `Aguarde ${secondsToRetry}s`;
  if (!isOpen) return 'Correção abre às 7h';
  if (!hasTheme) return themeMode === 'manual' && manualTheme.trim() ? 'Revise o tema' : 'Escolha um tema';
  if (characters > MAX_ESSAY_CHARACTERS) return 'Reduza o texto';
  if (words > MAX_WORDS) return `Reduza ${words - MAX_WORDS} ${words - MAX_WORDS === 1 ? 'palavra' : 'palavras'}`;
  if (words < MIN_WORDS) return `${MIN_WORDS - words === 1 ? 'Falta' : 'Faltam'} ${MIN_WORDS - words} ${MIN_WORDS - words === 1 ? 'palavra' : 'palavras'}`;
  return 'Corrigir com IA';
}

export function essayWordCountMessage(words: number): string {
  const message = words < MIN_WORDS ? `Mínimo de ${MIN_WORDS} palavras.`
    : words > MAX_WORDS ? 'Limite de palavras excedido.'
    : wordCountState(words) === 'near-limit' ? 'Perto do máximo de 500 palavras.'
    : 'Quantidade adequada para enviar.';
  return `${words} ${words === 1 ? 'palavra' : 'palavras'}. ${message}`;
}

export function essayDraftMessage({ status, meaningful, essay, savedAt }: {
  status: DraftStatus; meaningful: boolean; essay: string; savedAt: number | null;
}): string {
  if (status === 'invalid') return 'Não foi possível recuperar o rascunho salvo neste navegador.';
  if (!meaningful) return '';
  if (status === 'unavailable') return 'O rascunho não pôde ser salvo. Mantenha esta página aberta ou copie seu texto.';
  if (status === 'stopped') return 'O salvamento foi interrompido ao sair da conta. Copie seu texto antes de continuar.';
  if (status !== 'saved' && status !== 'restored') return '';
  const themeOnly = !essay.trim();
  if (!savedAt) return themeOnly ? 'Tema recuperado neste navegador.' : 'Rascunho recuperado neste navegador.';
  const time = new Date(savedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${themeOnly ? 'Tema salvo' : 'Salvo'} às ${time} neste navegador.`;
}
