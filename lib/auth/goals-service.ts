'use client';

/**
 * Goals Service
 * User goal CRUD operations
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import { sanitizeInput } from './validation';
import type { UserGoal } from './types';

const supabase = createClient();

/**
 * Get user goals
 */
export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      if (error) throw error;
      return data ?? [];
    });

    return data as UserGoal[];
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
}

/**
 * Create user goal
 */
export async function createUserGoal(userId: string, goal: Partial<UserGoal>): Promise<UserGoal> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await supabase
      .from('user_goals')
      .insert({
        user_id: userId,
        tipo: goal.tipo ?? 'redacao_nota_minima',
        descricao: goal.descricao ? sanitizeInput(goal.descricao) : 'Meta sem descrição',
        valor_alvo: goal.valor_alvo ?? null,
        disciplina: goal.disciplina ?? null,
        competencia: goal.competencia ?? null,
        prazo: goal.prazo ?? null,
        concluida: goal.concluida ?? false,
        progresso: goal.progresso ?? 0,
      })
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw error;
    return data;
  });

  return data as UserGoal;
}

/**
 * Update user goal
 */
export async function updateUserGoal(goalId: string, updates: Partial<UserGoal>): Promise<UserGoal> {
  const sanitizedUpdates = { ...updates };
  if (updates.descricao) {
    sanitizedUpdates.descricao = sanitizeInput(updates.descricao);
  }

  const data = await withTimeout(async (signal) => {
    const { data, error } = await supabase
      .from('user_goals')
      .update(sanitizedUpdates)
      .eq('id', goalId)
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw error;
    return data;
  });

  return data as UserGoal;
}

/**
 * Delete user goal
 */
export async function deleteUserGoal(goalId: string): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await supabase
      .from('user_goals')
      .delete()
      .eq('id', goalId)
      .abortSignal(signal);

    if (error) throw error;
  });
}
