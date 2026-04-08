'use client';

/**
 * Achievements Service
 * User achievements retrieval
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import type { UserAchievement } from './types';

const supabase = createClient();

/**
 * Get user achievements
 */
export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .abortSignal(signal);

      if (error) throw error;
      return data ?? [];
    });

    return data as UserAchievement[];
  } catch (error) {
    console.error('Erro ao buscar conquistas:', error);
    return [];
  }
}
