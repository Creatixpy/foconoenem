'use client';

/**
 * Profile Service
 * User profile CRUD operations
 */

import { sanitizeInput } from './validation';
import type { UserProfile } from './types';

async function parseProfileResponse(response: Response): Promise<UserProfile | null> {
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? 'Erro ao sincronizar perfil.');
  }

  return (payload?.profile ?? null) as UserProfile | null;
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    void userId;
    const response = await fetch('/api/perfil', { headers: { Accept: 'application/json' } });
    return parseProfileResponse(response);
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
    void userId;
    const response = await fetch('/api/perfil', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        nome_completo: nomeCompleto ? sanitizeInput(nomeCompleto) : null,
        objetivo: objetivo ? sanitizeInput(objetivo) : null,
      }),
    });

    return parseProfileResponse(response);
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

    void userId;
    const response = await fetch('/api/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(sanitizedUpdates),
    });

    return parseProfileResponse(response);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}
