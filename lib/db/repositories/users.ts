/**
 * User Repository
 * Database operations for user profiles, statistics, goals, and achievements
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../client';
import { toUserProfile, toUserStatistics, fromUserProfileUpdate } from '../transformers';
import type {
  UserProfile,
  UserStatistics,
  UserProfileRow,
  UserStatisticsRow,
  UserGoalRow,
  UserAchievementRow,
  AchievementRow,
} from '../types';

// ============================================================================
// Profile Operations
// ============================================================================

export async function getProfile(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserProfile | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .abortSignal(signal)
      .maybeSingle();

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data ? toUserProfile(data as UserProfileRow) : null;
}

export async function createProfile(
  client: SupabaseClient<Database>,
  userId: string,
  data: {
    nomeCompleto?: string | null;
    objetivo?: string | null;
  } = {}
): Promise<UserProfile> {
  const result = await withTimeout(async (signal) => {
    const { data: profile, error } = await client
      .from('user_profiles')
      .upsert(
        {
          user_id: userId,
          nome_completo: data.nomeCompleto ?? null,
          objetivo: data.objetivo ?? null,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return profile;
  });

  // Also create statistics record
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('user_statistics')
      .upsert({ user_id: userId }, { onConflict: 'user_id' })
      .abortSignal(signal);

    if (error) console.warn('Failed to create user statistics:', error);
  });

  return toUserProfile(result as UserProfileRow);
}

export async function updateProfile(
  client: SupabaseClient<Database>,
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  const dbUpdates = fromUserProfileUpdate(updates);

  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_profiles')
      .update(dbUpdates)
      .eq('user_id', userId)
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return toUserProfile(result as UserProfileRow);
}

// ============================================================================
// Statistics Operations
// ============================================================================

export async function getStatistics(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserStatistics | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_statistics')
      .select('*')
      .eq('user_id', userId)
      .abortSignal(signal)
      .maybeSingle();

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data ? toUserStatistics(data as UserStatisticsRow) : null;
}

export async function recalculateStatistics(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserStatistics | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .rpc('recalculate_user_statistics', { target_user_id: userId })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  }, 'extended');

  return data ? toUserStatistics(data as UserStatisticsRow) : null;
}

// ============================================================================
// Goals Operations
// ============================================================================

export async function getGoals(
  client: SupabaseClient<Database>,
  userId: string
): Promise<UserGoalRow[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data;
}

export async function createGoal(
  client: SupabaseClient<Database>,
  userId: string,
  goal: {
    tipo: UserGoalRow['tipo'];
    descricao: string;
    valorAlvo?: number | null;
    disciplina?: string | null;
    competencia?: number | null;
    prazo?: string | null;
  }
): Promise<UserGoalRow> {
  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_goals')
      .insert({
        user_id: userId,
        tipo: goal.tipo,
        descricao: goal.descricao,
        valor_alvo: goal.valorAlvo ?? null,
        disciplina: goal.disciplina ?? null,
        competencia: goal.competencia ?? null,
        prazo: goal.prazo ?? null,
        concluida: false,
        progresso: 0,
      })
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return result;
}

export async function updateGoal(
  client: SupabaseClient<Database>,
  goalId: string,
  updates: Partial<{
    descricao: string;
    valorAlvo: number | null;
    prazo: string | null;
    concluida: boolean;
    progresso: number;
  }>
): Promise<UserGoalRow> {
  const dbUpdates: Database['public']['Tables']['user_goals']['Update'] = {};
  if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
  if (updates.valorAlvo !== undefined) dbUpdates.valor_alvo = updates.valorAlvo;
  if (updates.prazo !== undefined) dbUpdates.prazo = updates.prazo;
  if (updates.concluida !== undefined) dbUpdates.concluida = updates.concluida;
  if (updates.progresso !== undefined) dbUpdates.progresso = updates.progresso;

  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_goals')
      .update(dbUpdates)
      .eq('id', goalId)
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return result;
}

export async function deleteGoal(
  client: SupabaseClient<Database>,
  goalId: string
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

// ============================================================================
// Achievements Operations
// ============================================================================

export async function getAchievements(
  client: SupabaseClient<Database>,
  userId: string
): Promise<(UserAchievementRow & { achievement: AchievementRow })[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('user_achievements')
      .select('*, achievement:achievements(*)')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data as (UserAchievementRow & { achievement: AchievementRow })[];
}
