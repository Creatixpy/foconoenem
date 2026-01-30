'use client';

/**
 * Core Authentication Service
 * Handles all authentication operations with security best practices
 */

import { createClient } from '@/lib/supabase/client';
import { withTimeout } from '@/lib/db/client';
import { SESSION_CONFIG, AUTH_ERROR_CODES, COMMUNITY_TERMS_VERSION } from './constants';
import { validatePassword, validateEmail, sanitizeInput } from './validation';
import {
  sanitizeRedirectPath,
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimit,
  updateLastActivity,
  clearAuthStorage,
} from './security';

const supabase = createClient();
import type {
  UserProfile,
  UserStatistics,
  UserGoal,
  UserAchievement,
  AuthResult,
  SignUpData,
  SignInData,
  OAuthSignupContext,
} from './types';

/**
 * Sign up a new user with email and password
 */
export async function signUp(data: SignUpData): Promise<AuthResult<{ needsConfirmation: boolean }>> {
  try {
    // Validate email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: emailValidation.error || 'Email inválido',
        },
      };
    }

    // Validate password
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.WEAK_PASSWORD,
          message: passwordValidation.errors[0] || 'Senha muito fraca',
        },
      };
    }

    // Sanitize inputs
    const nomeCompleto = data.nomeCompleto ? sanitizeInput(data.nomeCompleto) : undefined;
    const objetivo = data.objetivo ? sanitizeInput(data.objetivo) : undefined;

    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          nome_completo: nomeCompleto,
          objetivo,
        },
      },
    });

    if (error) {
      // Map Supabase errors to our error codes
      if (error.message.includes('already registered')) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.EMAIL_IN_USE,
            message: 'Este email já está cadastrado',
          },
        };
      }
      throw error;
    }

    return {
      success: true,
      data: {
        needsConfirmation: !authData.session,
      },
    };
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Não foi possível criar a conta. Tente novamente.',
      },
    };
  }
}

/**
 * Sign in with email and password
 */
export async function signIn(data: SignInData): Promise<AuthResult> {
  const rateLimitKey = `login:${data.email.toLowerCase()}`;

  try {
    // Check rate limit
    const rateLimit = checkRateLimit(rateLimitKey);
    if (!rateLimit.allowed) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.RATE_LIMITED,
          message: `Muitas tentativas. Tente novamente em ${Math.ceil((rateLimit.lockedUntil!.getTime() - Date.now()) / 60000)} minutos.`,
        },
      };
    }

    // Validate email
    const emailValidation = validateEmail(data.email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: 'Email ou senha incorretos',
        },
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    if (error) {
      // Record failed attempt
      recordRateLimitAttempt(rateLimitKey);

      if (error.message.includes('Invalid login credentials')) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
            message: 'Email ou senha incorretos',
          },
        };
      }

      if (error.message.includes('Email not confirmed')) {
        return {
          success: false,
          error: {
            code: AUTH_ERROR_CODES.EMAIL_NOT_CONFIRMED,
            message: 'Por favor, confirme seu email antes de entrar',
          },
        };
      }

      throw error;
    }

    // Clear rate limit on success
    clearRateLimit(rateLimitKey);
    updateLastActivity();

    return { success: true };
  } catch (error) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Não foi possível entrar. Tente novamente.',
      },
    };
  }
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle(options?: {
  nomeCompleto?: string;
  objetivo?: string;
  redirectTo?: string;
}): Promise<AuthResult> {
  try {
    // Build callback URL
    const baseRedirect = process.env.NODE_ENV === 'production'
      ? 'https://foconoenem.vercel.app/auth/callback'
      : `${window.location.origin}/auth/callback`;

    const callbackUrl = new URL(baseRedirect);
    
    if (options?.redirectTo) {
      const safeNext = sanitizeRedirectPath(options.redirectTo);
      callbackUrl.searchParams.set('next', safeNext);
    }

    // Store signup context for later profile creation
    if (options?.nomeCompleto || options?.objetivo) {
      try {
        const context: OAuthSignupContext = {
          nomeCompleto: options.nomeCompleto ? sanitizeInput(options.nomeCompleto) : null,
          objetivo: options.objetivo ? sanitizeInput(options.objetivo) : null,
          timestamp: Date.now(),
        };
        sessionStorage.setItem(
          SESSION_CONFIG.STORAGE_KEYS.SIGNUP_CONTEXT,
          JSON.stringify(context)
        );
      } catch {
        // Ignore storage errors
      }
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro no login com Google:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Não foi possível autenticar com Google. Tente novamente.',
      },
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    clearAuthStorage();

    return { success: true };
  } catch (error) {
    console.error('Erro ao sair:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Não foi possível sair. Tente novamente.',
      },
    };
  }
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get the current session
 */
export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * Refresh the current session
 */
export async function refreshSession(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.refreshSession();
    if (error) throw error;

    updateLastActivity();
    return { success: true };
  } catch (error) {
    console.error('Erro ao renovar sessão:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.SESSION_EXPIRED,
        message: 'Sua sessão expirou. Por favor, faça login novamente.',
      },
    };
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<AuthResult> {
  try {
    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
          message: emailValidation.error || 'Email inválido',
        },
      };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao solicitar reset de senha:', error);
    // Don't reveal if email exists or not
    return { success: true };
  }
}

/**
 * Update password
 */
export async function updatePassword(newPassword: string): Promise<AuthResult> {
  try {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: {
          code: AUTH_ERROR_CODES.WEAK_PASSWORD,
          message: passwordValidation.errors[0] || 'Senha muito fraca',
        },
      };
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    return {
      success: false,
      error: {
        code: AUTH_ERROR_CODES.UNKNOWN_ERROR,
        message: 'Não foi possível atualizar a senha. Tente novamente.',
      },
    };
  }
}

// ==================== Profile Management ====================

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

// ==================== Statistics ====================

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
        .single()
        .abortSignal(signal);

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

// ==================== Goals ====================

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
      .single()
      .abortSignal(signal);

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
      .single()
      .abortSignal(signal);

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

// ==================== Achievements ====================

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

// ==================== Community ====================

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
