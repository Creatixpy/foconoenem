'use client';

/**
 * Core Authentication Service
 * Handles all authentication operations with security best practices
 */

import { createClient } from '@/lib/supabase/client';
import { SESSION_CONFIG, AUTH_ERROR_CODES } from './constants';
import { validatePassword, validateEmail, sanitizeInput } from './validation';
import {
  sanitizeRedirectPath,
  checkRateLimit,
  recordRateLimitAttempt,
  clearRateLimit,
  updateLastActivity,
  clearAuthStorage,
} from './security';
import { createUserProfile } from './profile-service';

const supabase = createClient();
import type {
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

    // Create profile if session is available (email confirmed or confirmation disabled)
    if (authData.session?.user) {
      try {
        await createUserProfile(nomeCompleto, objetivo);
      } catch (profileError) {
        console.warn('Perfil será criado ao confirmar email:', profileError);
      }
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
    // Use window.location.origin to support Vercel Previews and any domain correctly
    const baseRedirect = `${window.location.origin}/auth/callback`;

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
        redirectTo: `${window.location.origin}/reset-password`,
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

