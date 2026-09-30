import { describe, expect, it, vi } from 'vitest';
import { apiError, failureMessage, retryAtFromResponse } from '../../lib/client/api-errors';
import { createDraftStore, clearUserDrafts, draftKey } from '../../lib/client/drafts';
import { createLatestRequest, deduplicateById } from '../../lib/client/latest-request';
import { calculateOperatingHours } from '../../lib/contracts/operating-hours';
import { essayValidation, manualThemeValidation } from '../../lib/contracts/essay-input';
import { EMPTY_ESSAY_DRAFT, EMPTY_QUIZ_DRAFT, essayDraftSchema, quizDraftSchema, freezeQuizSubmission } from '../../lib/contracts/student-drafts';

const userA = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const userB = '5549594d-3889-4469-a2e8-e78d0abf1cdb';
const questionId = '761442a5-05d3-44cb-bf3a-50cc7daf32cf';
const attemptId = '7590b36d-ec21-47cd-9d72-0c4609ac2c60';
const requestId = '161cfc57-9270-45cc-b527-b15706f890d2';
function memoryStorage() {
  const values = new Map<string, string>();
  return { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
}
function stores() {
  const local = memoryStorage();
  const session = memoryStorage();
  return { local, session, storage: (kind: 'essay' | 'quiz') => kind === 'essay' ? local : session };
}
const draft = {
  ...EMPTY_QUIZ_DRAFT,
  requestId,
  disciplines: ['Matemática' as const],
  attempt: {
    attemptId, expiresAt: '2026-10-01T12:00:00Z',
    questions: [{
      id: questionId, discipline: 'Matemática' as const, text: 'Qual alternativa resolve corretamente a questão apresentada?',
      alternatives: ['A', 'B', 'C', 'D'].map((id) => ({ id, text: `Alternativa ${id}` })),
    }],
  },
  selectedAnswers: { [questionId]: 'B' },
};

describe('rascunhos isolados por usuário', () => {
  it('restaura envelopes v1 antigos sem inventar horário de salvamento', () => {
    const { local, storage } = stores();
    const value = { ...EMPTY_ESSAY_DRAFT, essay: 'Texto recuperável' };
    local.setItem(draftKey('essay', userA), JSON.stringify({ version: 1, userId: userA, logoutVersion: null, value }));
    const store = createDraftStore('essay', userA, essayDraftSchema, storage);
    expect(store.read()).toEqual({ value, status: 'restored', savedAt: null });
    store.dispose();
  });

  it('mostra o horário somente após persistir e não o avança quando a quota falha', () => {
    const { local, session } = stores();
    let fail = false;
    const storage = (kind: 'essay' | 'quiz') => kind === 'quiz' ? session : {
      ...local, setItem: (key: string, value: string) => {
        if (fail) throw new Error('Quota exceeded');
        local.setItem(key, value);
      },
    };
    const store = createDraftStore('essay', userA, essayDraftSchema, storage);
    const clock = vi.spyOn(Date, 'now');
    try {
      clock.mockReturnValue(1_790_780_000_000);
      expect(store.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Texto salvo' })).toBe('saved');
      expect(store.savedAt).toBe(1_790_780_000_000);
      fail = true;
      clock.mockReturnValue(1_790_780_060_000);
      expect(store.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Texto ainda em memória' })).toBe('unavailable');
      expect(store.savedAt).toBe(1_790_780_000_000);
      expect(store.read().value?.essay).toBe('Texto salvo');
      expect(store.read().savedAt).toBe(1_790_780_000_000);
      fail = false;
      expect(store.clear()).toBe('empty');
      expect(store.savedAt).toBeNull();
    } finally {
      clock.mockRestore();
      store.dispose();
    }
  });

  it('rejeita metadados de horário corrompidos sem restaurar um envelope inválido', () => {
    const { local, storage } = stores();
    const store = createDraftStore('essay', userA, essayDraftSchema, storage);
    for (const savedAt of ['ontem', null, -1, 1.5, 8_640_000_000_000_001]) {
      local.setItem(draftKey('essay', userA), JSON.stringify({ version: 1, userId: userA, logoutVersion: null, value: EMPTY_ESSAY_DRAFT, savedAt }));
      expect(store.read()).toEqual({ value: null, status: 'invalid', savedAt: null });
    }
    store.dispose();
  });

  it('restaura texto, tema e identidade depois de uma resposta perdida', () => {
    const { storage } = stores();
    const saved = { ...EMPTY_ESSAY_DRAFT, essay: 'Trabalho do aluno', themeMode: 'manual' as const, manualTheme: 'Um tema válido', submission: { id: requestId, inputKey: 'entrada idempotente' } };
    const first = createDraftStore('essay', userA, essayDraftSchema, storage);
    expect(first.read()).toEqual({ value: null, status: 'empty', savedAt: null });
    expect(first.write(saved)).toBe('saved');
    first.dispose();
    const resumed = createDraftStore('essay', userA, essayDraftSchema, storage);
    expect(resumed.read()).toEqual({ value: saved, status: 'restored', savedAt: expect.any(Number) });
    resumed.dispose();
  });

  it('não mistura usuários nem armazenamento local e da aba', () => {
    const { storage, local, session } = stores();
    const first = createDraftStore('essay', userA, essayDraftSchema, storage);
    first.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Texto privado de A' });
    const second = createDraftStore('essay', userB, essayDraftSchema, storage);
    const quiz = createDraftStore('quiz', userA, quizDraftSchema, storage);
    quiz.write(draft);
    expect(second.read().value).toBeNull();
    expect(local.getItem(draftKey('quiz', userA))).toBeNull();
    expect(session.getItem(draftKey('essay', userA))).toBeNull();
    expect(quiz.read().value?.attempt?.attemptId).toBe(attemptId);
    [first, second, quiz].forEach((store) => store.dispose());
  });

  it('logout explícito limpa os dois rascunhos e impede gravações já em curso', () => {
    const { storage } = stores();
    const essay = createDraftStore('essay', userA, essayDraftSchema, storage);
    const quiz = createDraftStore('quiz', userA, quizDraftSchema, storage);
    const otherUser = createDraftStore('essay', userB, essayDraftSchema, storage);
    essay.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Rascunho a apagar' });
    quiz.write(draft);
    otherUser.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Rascunho de outro usuário' });
    clearUserDrafts(userA, storage);
    expect(essay.write({ ...EMPTY_ESSAY_DRAFT, essay: 'Resposta atrasada' })).toBe('stopped');
    expect(quiz.write(draft)).toBe('stopped');
    expect(storage('essay').getItem(draftKey('essay', userA))).toBeNull();
    expect(storage('quiz').getItem(draftKey('quiz', userA))).toBeNull();
    expect(otherUser.read().value?.essay).toBe('Rascunho de outro usuário');
    [essay, quiz, otherUser].forEach((store) => store.dispose());
  });

  it('desmontar após expiração da sessão não apaga o trabalho', () => {
    const { storage } = stores();
    const store = createDraftStore('quiz', userA, quizDraftSchema, storage);
    store.write(draft);
    store.dispose();
    const resumed = createDraftStore('quiz', userA, quizDraftSchema, storage);
    expect(resumed.read().value).toEqual(draft);
    resumed.clear();
    expect(resumed.read().value).toBeNull();
    resumed.dispose();
  });

  it('invalida rascunhos de outra aba mesmo se ela perdeu o evento de logout', () => {
    const local = memoryStorage();
    const sessionA = memoryStorage();
    const sessionB = memoryStorage();
    const storageA = (kind: 'essay' | 'quiz') => kind === 'essay' ? local : sessionA;
    const storageB = (kind: 'essay' | 'quiz') => kind === 'essay' ? local : sessionB;
    const beforeLogout = createDraftStore('quiz', userA, quizDraftSchema, storageB);
    beforeLogout.write(draft);
    beforeLogout.dispose();
    clearUserDrafts(userA, storageA);
    const afterLogout = createDraftStore('quiz', userA, quizDraftSchema, storageB);
    expect(afterLogout.read()).toEqual({ value: null, status: 'empty', savedAt: null });
    expect(afterLogout.write(draft)).toBe('saved');
    expect(afterLogout.read().value?.requestId).toBe(requestId);
    afterLogout.dispose();
  });

  it('rejeita JSON corrompido, formato incompatível e dados de foto', () => {
    const { storage, local } = stores();
    const store = createDraftStore('essay', userA, essayDraftSchema, storage);
    for (const raw of ['{', '{}', JSON.stringify({ ...EMPTY_ESSAY_DRAFT, photo: 'base64' })]) {
      local.setItem(draftKey('essay', userA), raw);
      expect(store.read()).toEqual({ value: null, status: 'invalid', savedAt: null });
    }
    store.dispose();
  });

  it('continua em memória quando getter, quota ou acesso falha', () => {
    const storage = () => { throw new Error('Storage denied'); };
    const store = createDraftStore('essay', userA, essayDraftSchema, storage);
    expect(store.read().status).toBe('unavailable');
    expect(store.write(EMPTY_ESSAY_DRAFT)).toBe('unavailable');
    expect(store.clear()).toBe('unavailable');
    expect(() => clearUserDrafts(userA, storage)).not.toThrow();
    expect(store.write(EMPTY_ESSAY_DRAFT)).toBe('stopped');
    store.dispose();
  });
});

describe('tentativa e envio congelado', () => {
  it('preserva requestId, attemptId, expiresAt e respostas em retries e reload', () => {
    const { storage } = stores();
    const store = createDraftStore('quiz', userA, quizDraftSchema, storage);
    const submission = freezeQuizSubmission(draft);
    store.write({ ...draft, submission });
    store.dispose();
    const resumed = createDraftStore('quiz', userA, quizDraftSchema, storage);
    const recovered = resumed.read().value!;
    const changedLocally = { ...recovered, selectedAnswers: { [questionId]: 'C' } };
    expect(freezeQuizSubmission(changedLocally)).toEqual({ attemptId, selectedAnswers: { [questionId]: 'B' } });
    expect(recovered.requestId).toBe(requestId);
    expect(recovered.attempt?.expiresAt).toBe(draft.attempt.expiresAt);
    resumed.dispose();
  });

  it('rejeita posição, alternativa ou identidade incompatíveis na retomada', () => {
    expect(quizDraftSchema.safeParse(draft).success).toBe(true);
    expect(quizDraftSchema.safeParse({ ...draft, currentIndex: 1 }).success).toBe(false);
    expect(quizDraftSchema.safeParse({ ...draft, selectedAnswers: { [questionId]: 'E' } }).success).toBe(false);
    expect(quizDraftSchema.safeParse({ ...draft, submission: { attemptId: requestId, selectedAnswers: {} } }).success).toBe(false);
  });
});

describe('interpretação de erros e limites', () => {
  it('explica sessão expirada, indisponibilidade e submissão em andamento', () => {
    expect(apiError(new Response(null, { status: 401 }), {}, 'fallback').kind).toBe('session');
    expect(apiError(new Response(null, { status: 503 }), {}, 'Sua redação foi mantida.').message).toBe('Sua redação foi mantida.');
    expect(apiError(new Response(null, { status: 409 }), { error: 'submission_in_progress' }, 'fallback').kind).toBe('in_progress');
    expect(failureMessage(new TypeError('Failed to fetch'))).toContain('Verifique sua conexão');
  });

  it('inclui a justificativa de fuga ao tema e diferencia tentativa expirada', () => {
    const problem = apiError(new Response(null, { status: 422 }), { error: 'off_topic', justification: 'O texto trata de outro assunto.' }, 'fallback');
    expect(problem.message).toContain('O texto trata de outro assunto.');
    expect(apiError(new Response(null, { status: 404 }), { error: 'quiz_not_found' }, 'fallback').kind).toBe('expired');
  });

  it('respeita resetAt e Retry-After, inclusive quando os dois estão presentes', () => {
    const now = Date.parse('2026-09-30T12:00:00Z');
    const response = new Response(null, { status: 429, headers: { 'Retry-After': '30' } });
    expect(retryAtFromResponse(response, {}, now)).toBe(now + 30_000);
    expect(retryAtFromResponse(response, { resetAt: new Date(now + 90_000).toISOString() }, now)).toBe(now + 90_000);
    expect(retryAtFromResponse(new Response(), { resetAt: 'corrompido' }, now)).toBe(now + 60_000);
    expect(retryAtFromResponse(new Response(null, { headers: { 'Retry-After': new Date(now + 45_000).toUTCString() } }), {}, now)).toBe(now + 45_000);
  });

  it('valida tema 5–300, redação 100–500 palavras e 5.000 caracteres sem cortar texto', () => {
    expect(manualThemeValidation('abcd')).not.toBe('');
    expect(manualThemeValidation('abcde')).toBe('');
    expect(manualThemeValidation('a'.repeat(300))).toBe('');
    expect(manualThemeValidation('a'.repeat(301))).not.toBe('');
    expect(essayValidation('palavra '.repeat(99))).not.toBe('');
    expect(essayValidation('palavra '.repeat(100))).toBe('');
    expect(essayValidation('palavra '.repeat(500))).toBe('');
    expect(essayValidation('palavra '.repeat(501))).not.toBe('');
    const tooLong = 'comprida'.repeat(6) + ' ';
    expect(essayValidation(tooLong.repeat(110))).toContain('5.000');
    expect(essayDraftSchema.parse({ ...EMPTY_ESSAY_DRAFT, essay: tooLong.repeat(110) }).essay).toBe(tooLong.repeat(110));
  });
});

describe('disponibilidade em America/Sao_Paulo', () => {
  it.each([
    ['2026-09-30T09:59:00Z', false, '06:59'],
    ['2026-09-30T10:00:00Z', true, '07:00'],
    ['2026-10-01T02:29:00Z', true, '23:29'],
    ['2026-10-01T02:30:00Z', false, '23:30'],
    ['2026-10-01T03:00:00Z', false, '00:00'],
  ])('avalia a fronteira %s', (iso, open, time) => {
    const info = calculateOperatingHours(new Date(iso));
    expect(info.isOpen).toBe(open);
    expect(info.currentTime).toBe(time);
    expect(info.nextOpenTime).toMatch(open ? /23:30$/ : /07:00$/);
  });
});

describe('requisições concorrentes e paginação de notícias', () => {
  it('apenas a consulta vigente pode atualizar resultado ou loading', async () => {
    const requests = createLatestRequest();
    let resolveOld!: () => void;
    let state = { content: '', loading: true };
    const old = requests.begin();
    const pending = new Promise<void>((resolve) => { resolveOld = resolve; }).then(() => {
      if (old.isCurrent()) state = { content: 'antiga', loading: false };
    });
    const current = requests.begin();
    expect(old.signal.aborted).toBe(true);
    resolveOld();
    await pending;
    expect(state).toEqual({ content: '', loading: true });
    if (current.isCurrent()) state = { content: 'vigente', loading: false };
    current.finish();
    expect(state.content).toBe('vigente');
    expect(requests.isPending()).toBe(false);
  });

  it('limpar resultados invalida até conclusões e finally atrasados', () => {
    const requests = createLatestRequest();
    const request = requests.begin();
    requests.cancel();
    expect(request.signal.aborted).toBe(true);
    expect(request.isCurrent()).toBe(false);
    expect(requests.isPending()).toBe(false);
  });

  it('deduplica páginas por ID sem alterar a ordem dos artigos anteriores', () => {
    expect(deduplicateById([{ id: 'a', title: 'A' }, { id: 'b', title: 'B' }, { id: 'b', title: 'B atualizado' }, { id: 'c', title: 'C' }])).toEqual([
      { id: 'a', title: 'A' }, { id: 'b', title: 'B atualizado' }, { id: 'c', title: 'C' },
    ]);
  });
});
