import { describe, expect, it } from 'vitest';
import { essaySubmitReason, hasMeaningfulEssayDraft, themeRequirementState, wordCountState, wordRequirementState } from '../../app/redacao/essay-presentation';
import { EMPTY_ESSAY_DRAFT } from '../../lib/contracts/student-drafts';
import { essayValidation } from '../../lib/contracts/essay-input';

const ready = { correcting: false, themeLoading: false, secondsToRetry: 0, isOpen: true, hasTheme: true, themeValidation: '', words: 100, characters: 1000 };

describe('orientação para envio da redação', () => {
  it.each([[0, 'pending'], [99, 'pending'], [100, 'met'], [449, 'met'], [450, 'near-limit'], [500, 'near-limit'], [501, 'violated']] as const)('mostra faixa de %i palavras sem reprovar 500', (words, state) => {
    expect(wordCountState(words)).toBe(state);
    expect(wordRequirementState(words)).toBe(words < 100 ? 'pending' : words > 500 ? 'violated' : 'met');
  });
  it('diferencia vazio, tema inválido e tema pronto', () => {
    expect(themeRequirementState(false, '', 'Use de 5 a 300 caracteres.')).toBe('pending');
    expect(themeRequirementState(false, 'abcd', 'Use de 5 a 300 caracteres.')).toBe('violated');
    expect(themeRequirementState(true, 'Tema válido', '')).toBe('met');
  });
  it('explica o primeiro impedimento e respeita a espera do servidor', () => {
    expect(essaySubmitReason(ready)).toBe('');
    expect(essaySubmitReason({ ...ready, words: 99 })).toContain('1 palavra');
    expect(essaySubmitReason({ ...ready, words: 501 })).toContain('1 palavra');
    expect(essaySubmitReason({ ...ready, hasTheme: false })).toContain('Escolha um tema');
    expect(essaySubmitReason({ ...ready, secondsToRetry: 23, words: 0 })).toContain('23s');
    expect(essaySubmitReason({ ...ready, correcting: true, secondsToRetry: 23 })).toContain('em andamento');
    expect(essaySubmitReason({ ...ready, isOpen: false })).toContain('Brasília');
  });
  it('mantém a trava técnica de caracteres mesmo com quantidade válida de palavras', () => {
    const exact = 'a'.repeat(4802) + ' a'.repeat(99);
    expect(exact.length).toBe(5000);
    expect(essayValidation(exact)).toBe('');
    expect(essayValidation(exact + 'a')).toContain('5.000');
    expect(essaySubmitReason({ ...ready, characters: 5001 })).toContain('5.000');
  });
  it('modo sozinho não é rascunho, mas tema sem redação é trabalho recuperável', () => {
    const manualDraft = { ...EMPTY_ESSAY_DRAFT, themeMode: 'manual' as const, essay: '  ' };
    expect(hasMeaningfulEssayDraft(manualDraft)).toBe(false);
    expect(hasMeaningfulEssayDraft({ ...EMPTY_ESSAY_DRAFT, manualTheme: 'Meu tema' })).toBe(true);
    expect(hasMeaningfulEssayDraft({ ...EMPTY_ESSAY_DRAFT, essay: 'Meu texto' })).toBe(true);
  });
});
