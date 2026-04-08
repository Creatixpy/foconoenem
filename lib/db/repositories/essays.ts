/**
 * Essays Repository
 * Database operations for essay results and themes
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../client';
import { toEssayResult, fromEssayResult } from '../transformers';
import type { EssayResult, EssayResultRow, CachedThemeRow } from '../types';

// ============================================================================
// Essay Result Operations
// ============================================================================

export async function getEssayById(
  client: SupabaseClient<Database>,
  essayId: string,
  userId?: string
): Promise<EssayResult | null> {
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

  return data ? toEssayResult(data as EssayResultRow) : null;
}

export async function getUserEssays(
  client: SupabaseClient<Database>,
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<EssayResult[]> {
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

  return data.map((row) => toEssayResult(row as EssayResultRow));
}

export async function createEssayResult(
  client: SupabaseClient<Database>,
  essay: Omit<EssayResult, 'createdAt'> & { id?: string }
): Promise<EssayResult> {
  const payload = fromEssayResult(essay);

  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('essay_results')
      .insert(payload as Database['public']['Tables']['essay_results']['Insert'])
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return toEssayResult(result as EssayResultRow);
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

export async function getRandomCachedTheme(
  client: SupabaseClient<Database>
): Promise<CachedThemeRow | null> {
  const data = await withTimeout(async (signal) => {
    // Get all themes and pick random one (Supabase doesn't support ORDER BY RANDOM() easily)
    const { data, error } = await client
      .from('cached_themes')
      .select('*')
      .order('usado_count', { ascending: true })
      .limit(10)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  }, 'fast');

  if (!data || data.length === 0) return null;

  // Pick random from least used themes
  const randomIndex = Math.floor(Math.random() * data.length);
  const theme = data[randomIndex];

  // Increment usage count
  await withTimeout(async (signal) => {
    await client
      .from('cached_themes')
      .update({ usado_count: (theme.usado_count ?? 0) + 1 })
      .eq('id', theme.id)
      .abortSignal(signal);
  }, 'fast').catch(() => {
    // Ignore update errors - not critical
  });

  return theme;
}

export async function createCachedTheme(
  client: SupabaseClient<Database>,
  theme: {
    tema: string;
    textoApoio1: string;
    textoApoio2: string;
  }
): Promise<CachedThemeRow> {
  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('cached_themes')
      .insert({
        tema: theme.tema,
        texto_apoio1: theme.textoApoio1,
        texto_apoio2: theme.textoApoio2,
        usado_count: 0,
      })
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return result;
}

export async function getCachedThemesCount(
  client: SupabaseClient<Database>
): Promise<number> {
  const data = await withTimeout(async (signal) => {
    const { count, error } = await client
      .from('cached_themes')
      .select('*', { count: 'exact', head: true })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return count ?? 0;
  }, 'fast');

  return data;
}
