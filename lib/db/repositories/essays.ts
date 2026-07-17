/**
 * Essays Repository
 * Database operations for essay results and themes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../query';

type EssayRow = Database['public']['Tables']['essay_results']['Row'];
type EssayResultRow = EssayRow;
type CachedThemeRow = Database['public']['Tables']['cached_themes']['Row'];
type EssayCompetence = {
  nota: number;
  comentario: string;
};
const THEME_LOOKBACK_DAYS = 90;

function normalizeThemeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

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

// ============================================================================
// Cached Themes Operations
// ============================================================================

export async function getCachedThemePool(
  client: SupabaseClient<Database>,
  options?: { daysBack?: number; limit?: number }
): Promise<CachedThemeRow[]> {
  const daysBack = options?.daysBack ?? THEME_LOOKBACK_DAYS;
  const limit = options?.limit ?? 50;
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  return withTimeout(async (signal) => {
    const { data, error } = await client
      .from('cached_themes')
      .select('*')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(limit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return (data ?? []) as CachedThemeRow[];
  }, 'fast');
}

export async function getRecentUserEssayThemes(
  client: SupabaseClient<Database>,
  userId: string,
  limit = 10
): Promise<string[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('essay_results')
      .select('tema')
      .eq('user_id', userId)
      .not('tema', 'is', null)
      .order('created_at', { ascending: false })
      .limit(limit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  }, 'fast');

  return data
    .map((row) => row.tema?.trim())
    .filter((tema): tema is string => Boolean(tema));
}

export async function findCachedThemeByTema(
  client: SupabaseClient<Database>,
  tema: string
): Promise<CachedThemeRow | null> {
  const normalizedTarget = normalizeThemeKey(tema);
  if (!normalizedTarget) return null;

  const pool = await getCachedThemePool(client, { daysBack: 3650, limit: 500 });
  return (
    pool.find((item) => normalizeThemeKey(item.tema) === normalizedTarget) ?? null
  );
}

export async function markCachedThemeAsUsed(
  client: SupabaseClient<Database>,
  themeId: string
): Promise<void> {
  const { error } = await client.rpc('increment_cached_theme_usage', {
    p_theme_id: themeId,
  });

  if (error) {
    throw DatabaseError.fromPostgrestError(error);
  }
}

export async function createCachedThemes(
  client: SupabaseClient<Database>,
  themes: Array<{ tema: string; textoApoio1: string; textoApoio2: string }>
): Promise<CachedThemeRow[]> {
  if (themes.length === 0) return [];

  const existing = await getCachedThemePool(client, { daysBack: 3650, limit: 500 });
  const existingByKey = new Map(
    existing.map((item) => [normalizeThemeKey(item.tema), item] as const)
  );

  const seenKeys = new Set<string>();
  const toInsert = themes
    .map((theme) => ({
      tema: theme.tema.trim(),
      texto_apoio1: theme.textoApoio1.trim(),
      texto_apoio2: theme.textoApoio2.trim(),
      usado_count: 0,
    }))
    .filter((theme) => {
      const key = normalizeThemeKey(theme.tema);
      if (!key || seenKeys.has(key) || existingByKey.has(key)) return false;
      seenKeys.add(key);
      return Boolean(theme.tema && theme.texto_apoio1 && theme.texto_apoio2);
    });

  if (toInsert.length === 0) return [];

  return withTimeout(async (signal) => {
    const { data, error } = await client
      .from('cached_themes')
      .insert(toInsert)
      .select('*')
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return (data ?? []) as CachedThemeRow[];
  }, 'fast');
}
