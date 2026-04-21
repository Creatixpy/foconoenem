import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { handleApiError, passwordSchema, sanitizeString } from '@/lib/security';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

const deleteAccountSchema = z.object({
  password: passwordSchema.transform(sanitizeString),
});

function getAllowedOrigins(request: NextRequest): Set<string> {
  const candidates = [
    request.nextUrl.origin,
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
  ];

  return new Set(
    candidates
      .map((candidate) => {
        if (!candidate) return null;
        try {
          return new URL(candidate).origin;
        } catch {
          return null;
        }
      })
      .filter((origin): origin is string => Boolean(origin))
  );
}

function getRequestOrigin(request: NextRequest): string | null {
  const rawOrigin = request.headers.get('origin') ?? request.headers.get('referer');
  if (!rawOrigin) return null;

  try {
    return new URL(rawOrigin).origin;
  } catch {
    return null;
  }
}

function supportsPasswordConfirmation(user: User): boolean {
  const providers = Array.isArray(user.app_metadata?.providers)
    ? user.app_metadata.providers.filter((provider): provider is string => typeof provider === 'string')
    : typeof user.app_metadata?.provider === 'string'
      ? [user.app_metadata.provider]
      : [];

  if (providers.length === 0) {
    return true;
  }

  return providers.includes('email');
}

function createVerificationClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Supabase client configuration error.');
  }

  return createClient<Database>(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const requestOrigin = getRequestOrigin(request);
    const allowedOrigins = getAllowedOrigins(request);

    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      return NextResponse.json(
        { error: 'forbidden_origin' },
        { status: 403 }
      );
    }

    const auth = await resolveRequestUserFromCookies({ requireEmailConfirmed: true });
    if ('error' in auth) {
      return auth.error;
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateResult = await checkRateLimit(`${auth.userId}:${ip}`, '/api/conta/excluir', 5, 10);

    if (!rateResult.allowed) {
      return NextResponse.json(
        { error: 'rate_limited', message: 'Muitas tentativas. Tente novamente em instantes.' },
        { status: 429 }
      );
    }

    const { password } = deleteAccountSchema.parse(await request.json());

    if (!auth.user.email || !supportsPasswordConfirmation(auth.user)) {
      return NextResponse.json(
        {
          error: 'password_confirmation_unavailable',
          message: 'Esta conta nao possui autenticacao por senha ativa.',
        },
        { status: 400 }
      );
    }

    const verificationClient = createVerificationClient();
    const { error: signInError } = await verificationClient.auth.signInWithPassword({
      email: auth.user.email.trim().toLowerCase(),
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'invalid_password', message: 'Senha incorreta.' },
        { status: 401 }
      );
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      throw new Error('Supabase admin nao configurado');
    }

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(auth.userId);
    if (deleteError) {
      throw deleteError;
    }

    await verificationClient.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
