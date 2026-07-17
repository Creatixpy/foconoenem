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
export async function getUserProfile(): Promise<UserProfile | null> {
  const response = await fetch('/api/perfil', { headers: { Accept: 'application/json' } });
  return parseProfileResponse(response);
}

/**
 * Create user profile
 */
export async function createUserProfile(
  nomeCompleto?: string,
  objetivo?: string | null
): Promise<UserProfile | null> {
  const response = await fetch('/api/perfil', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({
      nome_completo: nomeCompleto ? sanitizeInput(nomeCompleto) : null,
      objetivo: objetivo ? sanitizeInput(objetivo) : null,
    }),
  });

  return parseProfileResponse(response);
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  updates: Partial<UserProfile>
): Promise<UserProfile | null> {
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

  const response = await fetch('/api/perfil', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(sanitizedUpdates),
  });

  return parseProfileResponse(response);
}
