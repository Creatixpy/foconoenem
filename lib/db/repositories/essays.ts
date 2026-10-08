import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { EssayResult, GeneratedTheme } from '@/lib/contracts/essay';
import type { Database, Json } from '@/types/supabase';
import { DatabaseError, runQuery } from '@/lib/db/query';

type EssayRow = Database['public']['Tables']['essay_results']['Row'];
type CachedThemeRow = Database['public']['Tables']['cached_themes']['Row'];

export type EssaySubmissionIdentity = {
  submissionId: string;
  userId: string;
  inputFingerprint: string;
};

export type EssayResultSnapshot = Omit<EssayResult, 'createdAt' | 'origem'>;

export type EssaySubmissionClaim =
  | { state: 'claimed' }
  | { state: 'completed'; resultId: string }
  | { state: 'in_progress' }
  | { state: 'conflict' }
  | { state: 'off_topic'; justification: string };

export function normalizeEssayRow(row: EssayRow): EssayResult {
  return {
    id: row.id,
    nota: row.nota,
    competencia1: row.competencia1 as EssayResult['competencia1'],
    competencia2: row.competencia2 as EssayResult['competencia2'],
    competencia3: row.competencia3 as EssayResult['competencia3'],
    competencia4: row.competencia4 as EssayResult['competencia4'],
    competencia5: row.competencia5 as EssayResult['competencia5'],
    feedbackGeral: row.feedback_geral,
    pontoFortes: row.ponto_fortes ?? [],
    pontosAMelhorar: row.pontos_a_melhorar ?? [],
    redacaoOriginal: row.redacao_original,
    createdAt: row.created_at,
    origem: row.origem as EssayResult['origem'],
    tema: row.tema ?? undefined,
    textoApoio1: row.texto_apoio1 ?? undefined,
    textoApoio2: row.texto_apoio2 ?? undefined,
  };
}

function normalizeTheme(row: CachedThemeRow): GeneratedTheme {
  return {
    id: row.id,
    tema: row.tema,
    textoApoio1: row.texto_apoio1,
    textoApoio2: row.texto_apoio2,
  };
}

export async function getEssayById(
  client: SupabaseClient<Database>,
  essayId: string,
  userId: string
): Promise<EssayResult | null> {
  const row = await runQuery((signal) =>
    client
      .from('essay_results')
      .select('*')
      .eq('id', essayId)
      .eq('user_id', userId)
      .abortSignal(signal)
      .maybeSingle()
  );

  return row ? normalizeEssayRow(row) : null;
}

export async function getRecentEssayThemeTitles(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 10
): Promise<string[]> {
  const data = await runQuery((signal) =>
    client
      .from('essay_results')
      .select('tema')
      .eq('user_id', userId)
      .not('tema', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
      .abortSignal(signal)
  );
  return (data ?? [])
    .map((row) => row.tema?.trim())
    .filter((theme): theme is string => Boolean(theme));
}

export async function claimEssaySubmission(
  client: SupabaseClient<Database>,
  input: EssaySubmissionIdentity
): Promise<EssaySubmissionClaim> {
  const data = await runQuery((signal) =>
    client.rpc('claim_essay_submission', {
      p_submission_id: input.submissionId,
      p_user_id: input.userId,
      p_input_fingerprint: input.inputFingerprint,
    }).abortSignal(signal)
  );
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    throw new DatabaseError('Claim de redação inválido.', 'INVALID_CLAIM');
  }

  const state = data.state;
  if (state === 'completed') {
    const resultId = data.resultId;
    if (typeof resultId !== 'string') {
      throw new DatabaseError('Claim concluído sem resultado.', 'INVALID_CLAIM');
    }
    return { state, resultId };
  }
  if (state === 'off_topic') {
    const justification = data.justification;
    if (typeof justification !== 'string') {
      throw new DatabaseError('Rejeição sem justificativa.', 'INVALID_CLAIM');
    }
    return { state, justification };
  }
  if (state === 'claimed' || state === 'in_progress' || state === 'conflict') {
    return { state };
  }
  throw new DatabaseError('Estado de claim desconhecido.', 'INVALID_CLAIM');
}

export async function completeEssaySubmission(
  client: SupabaseClient<Database>,
  input: EssaySubmissionIdentity & { result: EssayResultSnapshot }
): Promise<EssayResult> {
  const data = await runQuery((signal) =>
    client.rpc('complete_essay_submission', {
      p_submission_id: input.submissionId,
      p_user_id: input.userId,
      p_input_fingerprint: input.inputFingerprint,
      p_result: input.result as unknown as Json,
    }).abortSignal(signal)
  );
  if (!data) throw new DatabaseError('A correção não foi persistida.', 'EMPTY_RESULT');
  return normalizeEssayRow(data);
}

export async function failEssaySubmission(
  client: SupabaseClient<Database>,
  input: EssaySubmissionIdentity & { errorMessage: string }
) {
  await runQuery((signal) =>
    client.rpc('fail_essay_submission', {
      p_submission_id: input.submissionId,
      p_user_id: input.userId,
      p_input_fingerprint: input.inputFingerprint,
      p_error_message: input.errorMessage,
    }).abortSignal(signal)
  );
}

export async function getGeneratedTheme(
  client: SupabaseClient<Database>,
  themeId: string,
  userId: string
): Promise<GeneratedTheme | null> {
  const data = await runQuery((signal) =>
    client.rpc('get_cached_theme', {
      p_theme_id: themeId,
      p_user_id: userId,
    }).abortSignal(signal)
  );
  return data ? normalizeTheme(data) : null;
}

export async function claimSharedTheme(
  client: SupabaseClient<Database>,
  userId: string
): Promise<GeneratedTheme | null> {
  const data = await runQuery((signal) =>
    client.rpc('claim_cached_theme', { p_user_id: userId }).abortSignal(signal)
  );
  return data ? normalizeTheme(data) : null;
}

export async function upsertGeneratedThemes(
  client: SupabaseClient<Database>,
  input: {
    userId: string;
    privateThemes: boolean;
    themes: Array<Omit<GeneratedTheme, 'id'>>;
  }
): Promise<GeneratedTheme[]> {
  const outcomes = await Promise.allSettled(
    input.themes.map(async (theme) => {
      const data = await runQuery((signal) =>
        client.rpc('upsert_cached_theme', {
          p_user_id: input.userId,
          p_private: input.privateThemes,
          p_theme: theme as unknown as Json,
        }).abortSignal(signal)
      );
      if (!data) throw new DatabaseError('O tema não foi persistido.', 'EMPTY_RESULT');
      return normalizeTheme(data);
    })
  );

  return outcomes.map((outcome) => {
    if (outcome.status === 'rejected') throw outcome.reason;
    return outcome.value;
  });
}
