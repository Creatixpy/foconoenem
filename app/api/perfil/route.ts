import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/server';
import { handleApiError } from '@/lib/server/security';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { sanitizeInput } from '@/lib/auth/validation';
import { getProfile, saveProfile, type ProfileChanges } from '@/lib/db/repositories/profiles';

const profilePayloadSchema = z.object({
  nome_completo: z.string().max(120).nullable().optional(),
  bio: z.string().max(500).nullable().optional(),
  objetivo: z.string().max(120).nullable().optional(),
  ano_enem: z.number().int().min(2020).max(2100).nullable().optional(),
});

function sanitizeNullable(value: string | null | undefined) {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value !== 'string') return null;
  const sanitized = sanitizeInput(value);
  return sanitized.length > 0 ? sanitized : null;
}

async function ensureProfile(userId: string, payload?: z.infer<typeof profilePayloadSchema>) {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Supabase admin nao configurado.');
  }

  const profilePayload: ProfileChanges = {};

  const nomeCompleto = sanitizeNullable(payload?.nome_completo);
  const bio = sanitizeNullable(payload?.bio);
  const objetivo = sanitizeNullable(payload?.objetivo);

  if (nomeCompleto !== undefined) profilePayload.nome_completo = nomeCompleto;
  if (bio !== undefined) profilePayload.bio = bio;
  if (objetivo !== undefined) profilePayload.objetivo = objetivo;
  if (payload && 'ano_enem' in payload) profilePayload.ano_enem = payload.ano_enem ?? null;

  return saveProfile(adminClient, userId, profilePayload);
}

export async function GET(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      throw new Error('Supabase admin nao configurado.');
    }

    const profile = await getProfile(adminClient, auth.userId);
    return NextResponse.json({ profile }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}

async function updateProfile(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const payload = profilePayloadSchema.parse(await request.json());
    const profile = await ensureProfile(auth.userId, payload);
    return NextResponse.json({ profile });
  } catch (error) {
    return handleApiError(error);
  }
}

export { updateProfile as POST, updateProfile as PATCH };
