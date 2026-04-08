'use client';

/**
 * Community Service
 * Community-related profile settings and age/terms confirmation
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import { COMMUNITY_TERMS_VERSION } from './constants';
import { sanitizeInput } from './validation';
import type { UserProfile } from './types';

const supabase = createClient();

/**
 * Confirm community age
 */
export async function confirmCommunityAge(userId: string): Promise<UserProfile | null> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          is_over_16: true,
          community_age_confirmed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    return data;
  } catch (error) {
    console.error('Erro ao confirmar idade:', error);
    throw error;
  }
}

/**
 * Accept community terms
 */
export async function acceptCommunityTerms(
  userId: string,
  version: string = COMMUNITY_TERMS_VERSION
): Promise<UserProfile | null> {
  try {
    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          community_terms_version: version,
          community_terms_accepted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    return data;
  } catch (error) {
    console.error('Erro ao aceitar termos:', error);
    throw error;
  }
}

/**
 * Update community settings
 */
export async function updateCommunitySettings(
  userId: string,
  settings: {
    community_tagline?: string | null;
    community_profile_theme?: string | null;
    community_show_statistics?: boolean;
  }
): Promise<UserProfile | null> {
  try {
    const sanitizedSettings = { ...settings };
    if (settings.community_tagline) {
      sanitizedSettings.community_tagline = sanitizeInput(settings.community_tagline);
    }

    const data = await withTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(sanitizedSettings)
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar configurações da comunidade:', error);
    throw error;
  }
}
