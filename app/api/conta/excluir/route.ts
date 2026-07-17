import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';
import { z } from 'zod';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { handleApiError, passwordSchema, sanitizeString } from '@/lib/security';
import type { Database } from '@/types/supabase';

export const dynamic = 'force-dynamic';

const deleteAccountSchema = z.object({
  password: passwordSchema.transform(sanitizeString),
});

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

async function deleteUserOwnedApplicationData(
  adminClient: NonNullable<ReturnType<typeof createAdminClient>>,
  userId: string
) {
  const userOwnedTables = [
    'quiz_attempts',
    'essay_results',
    'quiz_results',
    'analytics_events',
  ] as const;

  for (const table of userOwnedTables) {
    const { error } = await adminClient.from(table).delete().eq('user_id', userId);
    if (error) {
      throw new Error(`Falha ao remover dados da conta em ${table}.`);
    }
  }

  const { error: rateLimitError } = await adminClient
    .from('rate_limits')
    .delete()
    .or(`identifier.eq.${userId},identifier.like.${userId}:%`);

  if (rateLimitError) {
    console.error('Falha ao limpar rate limits da conta excluida:', rateLimitError);
  }
}

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
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

    await deleteUserOwnedApplicationData(adminClient, auth.userId);

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
