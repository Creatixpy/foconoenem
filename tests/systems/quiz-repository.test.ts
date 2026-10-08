import { createClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { CanonicalQuestion } from '../../lib/contracts/quiz';
import { DB_TIMEOUTS } from '../../lib/db/query';
import { getBalancedQuestions, upsertGeneratedQuestions } from '../../lib/db/repositories/quizzes';
import type { Database } from '../../types/supabase';

vi.mock('server-only', () => ({}));

function clientWith(fetcher: typeof fetch) {
  return createClient<Database>('https://database.test', 'local-test-key', {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: fetcher },
  });
}

function question(index: number): CanonicalQuestion {
  return {
    id: `01928cf9-4aca-4037-8ba0-673edc94be5${index}`,
    discipline: 'Matemática',
    text: `Questão contextualizada número ${index} da disciplina Matemática.`,
    alternatives: ['A', 'B', 'C', 'D'].map((id) => ({
      id, text: `Alternativa ${id} do enunciado ${index}`, isCorrect: id === 'B',
    })),
    explanation: 'A alternativa B resolve integralmente as condições propostas no enunciado.',
  };
}

describe('persistência concorrente de questões', () => {
  it('aguarda todos os writes iniciados e preserva o primeiro erro da ordem de entrada', async () => {
    let releaseSecond!: (response: Response) => void;
    let settled = false;
    const secondResponse = new Promise<Response>((resolve) => { releaseSecond = resolve; });
    const payloads: Array<{ p_question: Omit<CanonicalQuestion, 'id'> }> = [];
    const fetcher = vi.fn<typeof fetch>(async (_input, init) => {
      payloads.push(JSON.parse(String(init?.body)));
      return payloads.length === 1
        ? Response.json({ code: '22023', message: 'invalid_first_question' }, { status: 400 })
        : secondResponse;
    });
    const questions = [question(1), question(2)];
    const result = upsertGeneratedQuestions(clientWith(fetcher), questions).catch((error: unknown) => {
      settled = true;
      return error;
    });

    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).toBe(false);
    expect(payloads.map(({ p_question }) => p_question.text)).toEqual(questions.map((item) => item.text));
    expect(payloads.every(({ p_question }) => !('id' in p_question))).toBe(true);

    releaseSecond(Response.json({ code: '23505', message: 'conflict_second_question' }, { status: 409 }));
    await expect(result).resolves.toMatchObject({
      name: 'QuizRepositoryError', kind: 'invalid', message: 'invalid_first_question',
    });
  });

  it('usa oito segundos para a preparação do catálogo, reservando quatro para recuperação', async () => {
    vi.useFakeTimers();
    try {
      let requestSignal: AbortSignal | undefined;
      const client = clientWith(async (_input, init) => new Promise<Response>((_resolve, reject) => {
        requestSignal = init?.signal ?? undefined;
        requestSignal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')), { once: true });
      }));
      const result = getBalancedQuestions(client, ['Matemática']).catch((error: unknown) => error);

      await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.fast);
      expect(requestSignal?.aborted).toBe(false);
      await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.default - DB_TIMEOUTS.fast);
      expect(requestSignal?.aborted).toBe(true);
      await expect(result).resolves.toMatchObject({ name: 'DatabaseError' });
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });
});
