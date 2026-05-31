import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/db/server';
import { handleApiError } from '@/lib/security';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { sanitizeInput } from '@/lib/auth/validation';
import type { Database } from '@/types/supabase';

type ProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];

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

  const profilePayload: ProfileInsert = {
    user_id: userId,
  };

  const nomeCompleto = sanitizeNullable(payload?.nome_completo);
  const bio = sanitizeNullable(payload?.bio);
  const objetivo = sanitizeNullable(payload?.objetivo);

  if (nomeCompleto !== undefined) profilePayload.nome_completo = nomeCompleto;
  if (bio !== undefined) profilePayload.bio = bio;
  if (objetivo !== undefined) profilePayload.objetivo = objetivo;
  if (payload && 'ano_enem' in payload) profilePayload.ano_enem = payload.ano_enem ?? null;

  const { data, error } = await adminClient
    .from('user_profiles')
    .upsert(profilePayload, { onConflict: 'user_id', ignoreDuplicates: false })
    .select('*')
    .single();

  if (error) {
    throw new Error(`Falha ao salvar perfil: ${error.message}`);
  }

  await adminClient
    .from('user_statistics')
    .upsert({ user_id: userId }, { onConflict: 'user_id', ignoreDuplicates: true });

  return data;
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

    const { data, error } = await adminClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', auth.userId)
      .maybeSingle();

    if (error) {
      throw new Error(`Falha ao carregar perfil: ${error.message}`);
    }

    return NextResponse.json({ profile: data ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
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

export async function PATCH(request: NextRequest) {
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
