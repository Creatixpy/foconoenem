export const MIN_WORDS = 100;
export const MAX_WORDS = 500;
export const MAX_ESSAY_CHARACTERS = 5_000;

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function manualThemeValidation(title: string): string {
  const length = title.trim().length;
  return length < 5 || length > 300 ? 'O tema deve ter entre 5 e 300 caracteres.' : '';
}

export function essayValidation(text: string): string {
  const words = countWords(text);
  if (text.length > MAX_ESSAY_CHARACTERS) return 'A redação deve ter no máximo 5.000 caracteres. Revise o texto para enviar.';
  if (words < MIN_WORDS) return `Escreva pelo menos ${MIN_WORDS} palavras para enviar.`;
  if (words > MAX_WORDS) return `A redação deve ter no máximo ${MAX_WORDS} palavras. Revise o texto para enviar.`;
  return '';
}
