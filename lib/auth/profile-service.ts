'use client';

/**
 * Profile Service
 * User profile CRUD operations
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import { sanitizeInput } from './validation';
import type { UserProfile } from './types';

const supabase = createClient();

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
        .abortSignal(signal);

      if (error && error.code !== 'PGRST116') throw error;
      return data as UserProfile | null;
    });

    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

/**
 * Create user profile
 */
export async function createUserProfile(
  userId: string,
  nomeCompleto?: string,
  objetivo?: string | null
): Promise<UserProfile | null> {
  try {
    // Create profile
    const profile = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            nome_completo: nomeCompleto ? sanitizeInput(nomeCompleto) : null,
            objetivo: objetivo ? sanitizeInput(objetivo) : null,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    // Create statistics record
    await withTimeout(async (signal) => {
      const { error } = await supabase
        .from('user_statistics')
        .upsert({ user_id: userId }, { onConflict: 'user_id' })
        .abortSignal(signal);

      if (error) throw error;
    });

    return profile;
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
  try {
    // Sanitize text fields
    const sanitizedUpdates: Partial<UserProfile> = { ...updates };
    if (updates.nome_completo) {
      sanitizedUpdates.nome_completo = sanitizeInput(updates.nome_completo);
    }
    if (updates.objetivo) {
      sanitizedUpdates.objetivo = sanitizeInput(updates.objetivo);
    }
    if (updates.bio) {
      sanitizedUpdates.bio = sanitizeInput(updates.bio);
    }

    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(sanitizedUpdates)
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}
