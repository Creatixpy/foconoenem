import { describe, expect, it, vi } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import { DB_TIMEOUTS, DatabaseError } from '../../lib/db/query';
import {
  claimEssaySubmission,
  completeEssaySubmission,
  getEssayById,
  upsertGeneratedThemes,
  type EssayResultSnapshot,
} from '../../lib/db/repositories/essays';

vi.mock('server-only', () => ({}));

const identity = {
  submissionId: '161cfc57-9270-45cc-b527-b15706f890d2',
  userId: '01928cf9-4aca-4037-8ba0-673edc94be5a',
  inputFingerprint: 'stable-fingerprint',
};

function rpcClient(data: unknown) {
  const abortSignal = vi.fn(async (_signal: AbortSignal) => ({ data, error: null }));
  const rpc = vi.fn(() => ({ abortSignal }));
  return { client: { rpc } as unknown as SupabaseClient<Database>, rpc, abortSignal };
}

describe('persistência de redações com duração limitada', () => {
  it('aguarda writes ativos de temas antes de devolver a falha do lote', async () => {
    let releaseSecond!: (response: Response) => void;
    let settled = false;
    const secondResponse = new Promise<Response>((resolve) => { releaseSecond = resolve; });
    const fetcher = vi.fn<typeof fetch>(async () => fetcher.mock.calls.length === 1
      ? Response.json({ code: '22023', message: 'invalid_first_theme' }, { status: 400 })
      : secondResponse);
    const client = createClient<Database>('https://database.test', 'local-test-key', {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: fetcher },
    });
    const themes = [
      { tema: 'Acesso à cultura', textoApoio1: 'Contexto social.', textoApoio2: 'Desafios culturais.' },
      { tema: 'Educação inclusiva', textoApoio1: 'Contexto escolar.', textoApoio2: 'Desafios educacionais.' },
    ];
    const result = upsertGeneratedThemes(client, {
      userId: identity.userId, privateThemes: true, themes,
    }).catch((error: unknown) => {
      settled = true;
      return error;
    });

    await vi.waitFor(() => expect(fetcher).toHaveBeenCalledTimes(2));
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(settled).toBe(false);
    expect(fetcher.mock.calls.map(([, init]) => JSON.parse(String(init?.body)))).toEqual(
      themes.map((theme) => ({ p_user_id: identity.userId, p_private: true, p_theme: theme }))
    );

    releaseSecond(Response.json({ code: '23505', message: 'conflict_second_theme' }, { status: 409 }));
    await expect(result).resolves.toMatchObject({
      name: 'DatabaseError', code: '22023', message: 'invalid_first_theme',
    });
  });

  it.each([
    { error: null, expected: 'missing' },
    { error: { code: 'PGRST116', message: 'Multiple rows returned' }, expected: 'invalid' },
  ])('distingue ausência de resposta inválida mantendo o proprietário: $expected', async ({ error }) => {
    const query = {
      select: vi.fn(() => query),
      eq: vi.fn(() => query),
      abortSignal: vi.fn(() => query),
      maybeSingle: vi.fn(async () => ({ data: null, error })),
    };
    const client = { from: vi.fn(() => query) } as unknown as SupabaseClient<Database>;
    const result = getEssayById(client, identity.submissionId, identity.userId);

    if (error) {
      await expect(result).rejects.toMatchObject({ name: 'DatabaseError', code: 'PGRST116' });
    } else {
      await expect(result).resolves.toBeNull();
    }
    expect(query.eq).toHaveBeenCalledWith('id', identity.submissionId);
    expect(query.eq).toHaveBeenCalledWith('user_id', identity.userId);
  });

  it('aborta um claim pendente no timeout padrão e retorna erro de banco', async () => {
    vi.useFakeTimers();
    try {
      let requestSignal: AbortSignal | undefined;
      const client = {
        rpc: () => ({
          abortSignal: (signal: AbortSignal) => new Promise((resolve) => {
            requestSignal = signal;
            signal.addEventListener('abort', () => resolve({ data: null, error: { code: 'ABORTED', message: 'Request aborted' } }), { once: true });
          }),
        }),
      } as unknown as SupabaseClient<Database>;
      const claim = claimEssaySubmission(client, identity);
      const rejected = expect(claim).rejects.toMatchObject({ name: 'DatabaseError', code: 'ABORTED' });

      await vi.advanceTimersByTimeAsync(DB_TIMEOUTS.default);
      await rejected;
      expect(requestSignal?.aborted).toBe(true);
      expect(vi.getTimerCount()).toBe(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it.each([null, [], { state: 'unknown' }, { state: 'completed' }, { state: 'off_topic' }])('recusa payload de claim inválido: %j', async (data) => {
    const { client } = rpcClient(data);
    await expect(claimEssaySubmission(client, identity)).rejects.toBeInstanceOf(DatabaseError);
  });

  it('mapeia o resultado canônico retornado pela transação, incluindo snapshot histórico', async () => {
    const competence = { nota: 160 as const, comentario: 'Comentário específico sobre o texto da redação.' };
    const result: EssayResultSnapshot = {
      id: '6c07e303-9abc-43cb-a0c5-07d9f89bb239', nota: 800,
      competencia1: competence, competencia2: competence, competencia3: competence,
      competencia4: competence, competencia5: competence,
      feedbackGeral: 'Feedback que considera a argumentação apresentada no texto.',
      pontoFortes: ['Argumentação coerente'], pontosAMelhorar: ['Mais repertório'],
      redacaoOriginal: 'Texto enviado à correção.', tema: 'O acesso à cultura no Brasil',
      textoApoio1: 'Contexto social do tema.', textoApoio2: 'Desafios do tema.',
    };
    const canonicalId = 'c2c5e7ab-b23b-43ad-b34a-c4fc71bba6e5';
    const row = {
      id: canonicalId, user_id: identity.userId, nota: 800,
      competencia1: competence, competencia2: competence, competencia3: competence,
      competencia4: competence, competencia5: competence,
      feedback_geral: result.feedbackGeral, ponto_fortes: result.pontoFortes,
      pontos_a_melhorar: result.pontosAMelhorar, redacao_original: result.redacaoOriginal,
      created_at: '2026-10-08T12:00:00Z', origem: 'IA', tema: result.tema,
      texto_apoio1: result.textoApoio1, texto_apoio2: result.textoApoio2,
    };
    const { client, rpc, abortSignal } = rpcClient(row);

    expect(await completeEssaySubmission(client, { ...identity, result })).toEqual({
      ...result, id: canonicalId, createdAt: row.created_at, origem: 'IA',
    });
    expect(rpc).toHaveBeenCalledWith('complete_essay_submission', {
      p_submission_id: identity.submissionId, p_user_id: identity.userId,
      p_input_fingerprint: identity.inputFingerprint, p_result: result,
    });
    expect(abortSignal).toHaveBeenCalledWith(expect.any(AbortSignal));
  });
});
