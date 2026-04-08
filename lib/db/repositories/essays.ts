/**
 * Essays Repository
 * Database operations for essay results and themes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../client';
import type { EssayResultRow, CachedThemeRow, EssayCompetence } from '../types';

type EssayRow = Database['public']['Tables']['essay_results']['Row'];

/** Normalized essay result shape returned to API consumers */
export type NormalizedEssayResult = {
  id: string;
  nota: number;
  competencia1: EssayCompetence;
  competencia2: EssayCompetence;
  competencia3: EssayCompetence;
  competencia4: EssayCompetence;
  competencia5: EssayCompetence;
  feedbackGeral: string;
  pontoFortes: string[];
  pontosAMelhorar: string[];
  redacaoOriginal: string;
  createdAt: string;
  origem: 'IA' | 'Simulação';
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
};

/** Convert a DB row to the normalized camelCase shape */
export function normalizeEssayRow(row: EssayRow): NormalizedEssayResult {
  return {
    id: row.id,
    nota: row.nota,
    competencia1: row.competencia1 as unknown as EssayCompetence,
    competencia2: row.competencia2 as unknown as EssayCompetence,
    competencia3: row.competencia3 as unknown as EssayCompetence,
    competencia4: row.competencia4 as unknown as EssayCompetence,
    competencia5: row.competencia5 as unknown as EssayCompetence,
    feedbackGeral: row.feedback_geral,
    pontoFortes: (row.ponto_fortes as string[] | null) ?? [],
    pontosAMelhorar: (row.pontos_a_melhorar as string[] | null) ?? [],
    redacaoOriginal: row.redacao_original,
    createdAt: row.created_at,
    origem: row.origem as NormalizedEssayResult['origem'],
    tema: row.tema ?? undefined,
    textoApoio1: row.texto_apoio1 ?? undefined,
    textoApoio2: row.texto_apoio2 ?? undefined,
  };
}

// ============================================================================
// Essay Result Operations
// ============================================================================

export async function getEssayById(
  client: SupabaseClient<Database>,
  essayId: string,
  userId?: string
): Promise<NormalizedEssayResult | null> {
  const data = await withTimeout(async (signal) => {
    let query = client
      .from('essay_results')
      .select('*')
      .eq('id', essayId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.abortSignal(signal).maybeSingle();

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data ? normalizeEssayRow(data as EssayResultRow) : null;
}

export async function getUserEssays(
  client: SupabaseClient<Database>,
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<NormalizedEssayResult[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('essay_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data.map((row) => normalizeEssayRow(row as EssayResultRow));
}

export async function createEssayResult(
  client: SupabaseClient<Database>,
  result: NormalizedEssayResult,
  userId: string
): Promise<void> {
  const payload: Database['public']['Tables']['essay_results']['Insert'] = {
    id: result.id,
    nota: result.nota,
    competencia1: result.competencia1 as unknown as Json,
    competencia2: result.competencia2 as unknown as Json,
    competencia3: result.competencia3 as unknown as Json,
    competencia4: result.competencia4 as unknown as Json,
    competencia5: result.competencia5 as unknown as Json,
    feedback_geral: result.feedbackGeral,
    ponto_fortes: result.pontoFortes,
    pontos_a_melhorar: result.pontosAMelhorar,
    redacao_original: result.redacaoOriginal,
    created_at: result.createdAt,
    origem: result.origem,
    tema: result.tema ?? null,
    texto_apoio1: result.textoApoio1 ?? null,
    texto_apoio2: result.textoApoio2 ?? null,
    user_id: userId,
  };

  await withTimeout(async (signal) => {
    const { error } = await client
      .from('essay_results')
      .insert(payload)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

export async function getEssayStats(
  client: SupabaseClient<Database>,
  userId: string
): Promise<{
  total: number;
  averageScore: number | null;
  bestScore: number | null;
  worstScore: number | null;
}> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('essay_results')
      .select('nota')
      .eq('user_id', userId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  if (data.length === 0) {
    return { total: 0, averageScore: null, bestScore: null, worstScore: null };
  }

  const scores = data.map((row) => row.nota);
  const total = scores.length;
  const averageScore = scores.reduce((a, b) => a + b, 0) / total;
  const bestScore = Math.max(...scores);
  const worstScore = Math.min(...scores);

  return { total, averageScore, bestScore, worstScore };
}

// ============================================================================
// Cached Themes Operations
// ============================================================================

export async function getLeastUsedCachedTheme(
  client: SupabaseClient<Database>
): Promise<CachedThemeRow | null> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('cached_themes')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('usado_count', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .abortSignal(signal)
      .maybeSingle();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  }, 'fast');

  if (!data) return null;

  // Increment usage count (fire and forget)
  withTimeout(async (signal) => {
    await client
      .from('cached_themes')
      .update({ usado_count: (data.usado_count ?? 0) + 1 })
      .eq('id', data.id)
      .abortSignal(signal);
  }, 'fast').catch(() => {});

  return data;
}

export async function createCachedTheme(
  client: SupabaseClient<Database>,
  theme: { tema: string; textoApoio1: string; textoApoio2: string }
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('cached_themes')
      .insert({
        tema: theme.tema,
        texto_apoio1: theme.textoApoio1,
        texto_apoio2: theme.textoApoio2,
        usado_count: 1,
      })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  }, 'fast');
}
