import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DISCIPLINES, type CanonicalQuestion, type Discipline } from '../../lib/contracts/quiz';
import type { UserAiRuntime } from '../../lib/server/ai/provider';
import type { Database } from '../../types/supabase';

const repository = vi.hoisted(() => ({
  find: vi.fn(), catalog: vi.fn(), upsert: vi.fn(), create: vi.fn(),
}));
const generate = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@/lib/db/repositories/quizzes', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../lib/db/repositories/quizzes')>(),
  getAttemptByRequestId: repository.find,
  getBalancedQuestions: repository.catalog,
  upsertGeneratedQuestions: repository.upsert,
  createQuizAttempt: repository.create,
}));
vi.mock('@/lib/server/quiz/generator', () => ({ generateQuestionsForDiscipline: generate }));

import { prepareQuiz } from '../../lib/server/quiz/service';
import { mapWithConcurrency } from '../../lib/server/quiz/concurrency';
import { QuizRepositoryError } from '../../lib/db/repositories/quizzes';
import { requestQuizAttempt, requestQuizResult } from '../../app/questoes/quiz-api';

const client = {} as SupabaseClient<Database>;
const input = { userId: randomUUID(), requestId: randomUUID(), disciplines: ['Matemática'] as Discipline[] };
const attempt = { id: randomUUID(), expires_at: '2026-10-10T12:00:00.000Z' };
const runtime = (hasMaxAccess = false) => ({
  subscription: { hasMaxAccess } as UserAiRuntime['subscription'],
  complete: vi.fn(),
});

function question(index: number, discipline: Discipline = 'Matemática'): CanonicalQuestion {
  return {
    id: randomUUID(), discipline,
    text: `Questão contextualizada número ${index} da disciplina ${discipline}.`,
    alternatives: ['A', 'B', 'C', 'D'].map((id) => ({
      id, text: `Alternativa ${id} do enunciado ${index}`, isCorrect: id === 'B',
    })),
    explanation: 'A alternativa B resolve integralmente as condições propostas no enunciado.',
  };
}

beforeEach(() => {
  repository.find.mockResolvedValue(null);
  repository.catalog.mockResolvedValue({});
  repository.upsert.mockImplementation(async (_client, questions) => questions);
  repository.create.mockResolvedValue(attempt);
});
afterEach(() => { vi.resetAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('preparação canônica de simulados', () => {
  it('recupera requestId sem carregar assinatura, catálogo ou IA e sem vazar gabarito', async () => {
    const questions = [question(1), question(2), question(3)];
    repository.find.mockResolvedValue({ id: attempt.id, expiresAt: attempt.expires_at, questions });
    const loadRuntime = vi.fn(async () => runtime());
    const result = await prepareQuiz(client, loadRuntime, input);

    expect(result.attemptId).toBe(attempt.id);
    expect(result.questions.map((item) => item.id)).toEqual(questions.map((item) => item.id));
    expect(result.questions.every((item) => !('explanation' in item))).toBe(true);
    expect(result.questions.flatMap((item) => item.alternatives).every((item) => !('isCorrect' in item))).toBe(true);
    expect(loadRuntime).not.toHaveBeenCalled();
    expect(repository.find).toHaveBeenCalledWith(client, input.userId, input.requestId);
    expect(repository.catalog).not.toHaveBeenCalled();
    expect(repository.create).not.toHaveBeenCalled();
    expect(generate).not.toHaveBeenCalled();
  });

  it('reutiliza três questões distintas do catálogo no plano Free', async () => {
    const questions = [question(1), question(2), question(3)];
    repository.catalog.mockResolvedValue({ Matemática: [...questions, { ...questions[0] }] });
    const result = await prepareQuiz(client, async () => runtime(), input);

    expect(result.questions).toHaveLength(3);
    expect(new Set(result.questions.map((item) => item.id))).toEqual(new Set(questions.map((item) => item.id)));
    expect(generate).not.toHaveBeenCalled();
    expect(repository.create).toHaveBeenCalledWith(client, expect.objectContaining({
      userId: input.userId, requestId: input.requestId, questions: expect.any(Array),
    }));
  });

  it('gera somente a quantidade faltante e usa IDs canônicos após deduplicação do banco', async () => {
    const stored = question(1);
    const generated = [question(2), question(3)];
    const canonical = generated.map((item) => ({ ...item, id: randomUUID() }));
    repository.catalog.mockResolvedValue({ Matemática: [stored, { ...stored }] });
    generate.mockResolvedValue({ questions: generated });
    repository.upsert.mockResolvedValue(canonical);
    const result = await prepareQuiz(client, async () => runtime(), input);

    expect(generate).toHaveBeenCalledWith(expect.anything(), {
      discipline: 'Matemática', count: 2, excludedTexts: [stored.text, stored.text],
    });
    expect(new Set(result.questions.map((item) => item.id))).toEqual(new Set([stored.id, ...canonical.map((item) => item.id)]));
  });

  it('gera todas as questões Max preservando o catálogo como exclusão', async () => {
    const stored = [question(1), question(2), question(3)];
    const generated = [question(4), question(5), question(6)];
    repository.catalog.mockResolvedValue({ Matemática: stored });
    generate.mockResolvedValue({ questions: generated });
    const result = await prepareQuiz(client, async () => runtime(true), input);

    expect(generate).toHaveBeenCalledWith(expect.anything(), {
      discipline: 'Matemática', count: 3, excludedTexts: expect.arrayContaining(stored.map((item) => item.text)),
    });
    expect(new Set(result.questions.map((item) => item.id))).toEqual(new Set(generated.map((item) => item.id)));
  });

  it('não persiste tentativa incompleta quando o catálogo deduplica a geração', async () => {
    const repeated = question(1);
    generate.mockResolvedValue({ questions: [repeated, { ...repeated }, { ...repeated }] });
    await expect(prepareQuiz(client, async () => runtime(), input)).rejects.toThrow('Não foi possível preparar 3 questões');
    expect(repository.create).not.toHaveBeenCalled();
  });

  it('limita geração concorrente a duas disciplinas e mantém três questões por disciplina', async () => {
    let active = 0;
    let peak = 0;
    generate.mockImplementation(async (_runtime, { discipline }) => {
      active += 1;
      peak = Math.max(peak, active);
      await Promise.resolve();
      active -= 1;
      return { questions: [question(1, discipline), question(2, discipline), question(3, discipline)] };
    });
    const result = await prepareQuiz(client, async () => runtime(), { ...input, disciplines: [...DISCIPLINES] });

    expect(peak).toBe(2);
    expect(result.questions).toHaveLength(15);
    for (const discipline of DISCIPLINES) {
      expect(result.questions.filter((item) => item.discipline === discipline)).toHaveLength(3);
    }
  });

  it('propaga a colisão transacional em vez de retornar perguntas locais', async () => {
    repository.catalog.mockResolvedValue({ Matemática: [question(1), question(2), question(3)] });
    const conflict = new QuizRepositoryError('conflict', 'quiz_request_conflict');
    repository.create.mockRejectedValue(conflict);
    await expect(prepareQuiz(client, async () => runtime(), input)).rejects.toBe(conflict);
  });
});

describe('concorrência limitada no runtime', () => {
  it('preserva a ordem de entrada mesmo quando os jobs terminam em outra ordem', async () => {
    const releases: Array<() => void> = [];
    const result = mapWithConcurrency([0, 1], 2, (index) => new Promise<string>((resolve) => {
      releases[index] = () => resolve(`result-${index}`);
    }));
    releases[1]();
    releases[0]();
    await expect(result).resolves.toEqual(['result-0', 'result-1']);
  });

  it('para novos jobs na primeira falha e aguarda os que já começaram', async () => {
    const failure = new Error('provider failed');
    let release: () => void = () => {};
    const started: number[] = [];
    let settled = false;
    const result = mapWithConcurrency([0, 1, 2, 3], 2, (index) => {
      started.push(index);
      if (index === 0) return Promise.reject(failure);
      return new Promise<void>((resolve) => { release = resolve; });
    }).then(() => null, (error: unknown) => { settled = true; return error; });

    await Promise.resolve();
    expect(started).toEqual([0, 1]);
    expect(settled).toBe(false);
    release();
    expect(await result).toBe(failure);
    expect(started).toEqual([0, 1]);
  });
});

describe('respostas do endpoint no cliente', () => {
  it('valida POST para impedir que payload com gabarito entre no draft', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({
      attemptId: attempt.id, expiresAt: attempt.expires_at, questions: [question(1)],
    })));
    await expect(requestQuizAttempt(input.requestId, input.disciplines, new AbortController().signal))
      .rejects.toMatchObject({ kind: 'unavailable' });
  });

  it.each([404, 410])('classifica PATCH %s para permitir recuperação com um novo simulado', async (status) => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ error: 'quiz_not_found' }, { status })));
    await expect(requestQuizResult({ attemptId: attempt.id, selectedAnswers: {} }, new AbortController().signal))
      .rejects.toMatchObject({ kind: 'expired' });
  });
});

describe('limite de consulta na finalização canônica', () => {
  it('aborta um RPC sem resposta preservando proprietário e snapshot do envio', async () => {
    const actualRepository = await vi.importActual<typeof import('../../lib/db/repositories/quizzes')>(
      '../../lib/db/repositories/quizzes'
    );
    vi.useFakeTimers();
    let querySignal: AbortSignal | undefined;
    const rpc = vi.fn(() => ({
      abortSignal: (signal: AbortSignal) => {
        querySignal = signal;
        return new Promise<{ data: null; error: { message: string } }>((resolve) => {
          signal.addEventListener('abort', () => resolve({ data: null, error: { message: 'aborted' } }), { once: true });
        });
      },
    }));
    const selectedAnswers = { [randomUUID()]: 'B' };
    const result = actualRepository.submitQuizAttempt({ rpc } as unknown as SupabaseClient<Database>, {
      attemptId: attempt.id, userId: input.userId, selectedAnswers,
    }).catch((error: unknown) => error);

    expect(rpc).toHaveBeenCalledWith('submit_quiz_attempt', {
      p_attempt_id: attempt.id, p_user_id: input.userId, p_selected_answers: selectedAnswers,
    });
    expect(querySignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(8_000);
    expect(querySignal?.aborted).toBe(true);
    expect(await result).toMatchObject({ kind: 'database', message: 'aborted' });
  });
});
