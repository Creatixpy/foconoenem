'use client';

/**
 * Statistics Service
 * User statistics retrieval and recalculation
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import type { UserStatistics } from './types';

const supabase = createClient();

/**
 * Get user statistics
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .abortSignal(signal)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserStatistics | null;
    });

    if (!data) return null;

    // Normalize numeric fields that come as strings from Postgres
    const parseNumeric = (value: unknown): number | null => {
      if (value === null || value === undefined) return null;
      if (typeof value === 'number') return Number.isFinite(value) ? value : null;
      if (typeof value === 'string') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
      }
      return null;
    };

    const numericFields = [
      'media_nota_redacao',
      'media_competencia1',
      'media_competencia2',
      'media_competencia3',
      'media_competencia4',
      'media_competencia5',
      'taxa_acerto',
    ] as const;

    const normalized = { ...data } as UserStatistics;
    const rawData = data as unknown as Record<string, unknown>;

    for (const field of numericFields) {
      (normalized as unknown as Record<string, unknown>)[field] = parseNumeric(rawData[field]);
    }

    return normalized;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}

/**
 * Recalculate user statistics
 */
export async function recalculateUserStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const { data, error } = await withTimeout(async (signal) => {
      return await supabase
        .rpc('recalculate_user_statistics', { target_user_id: userId })
        .abortSignal(signal);
    });

    if (error) throw error;
    return data as UserStatistics | null;
  } catch (error) {
    console.error('Erro ao recalcular estatísticas:', error);
    return null;
  }
}
