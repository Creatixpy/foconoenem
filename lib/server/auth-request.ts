'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createAdminClient, createServerClient } from '@/lib/db/server';

type AuthSuccess = {
  supabase: SupabaseClient<Database>;
  userId: string;
  token: string;
  user: User;
};

type AuthFailure = {
  error: NextResponse;
};

type ResolveRequestUserOptions = {
  requireEmailConfirmed?: boolean;
};

/**
 * Creates a per-request Supabase client scoped to the user's JWT.
 * Queries go through RLS instead of bypassing it with service_role.
 */
function createUserScopedClient(token: string): SupabaseClient<Database> | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  return createClient<Database>(url, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/**
 * Resolves authenticated user from browser cookies (automatic).
 * Preferred for all Route Handlers called by the frontend — the browser
 * sends cookies automatically so no Authorization header is needed.
 */
export async function resolveRequestUserFromCookies(
  options: ResolveRequestUserOptions = {}
): Promise<AuthSuccess | AuthFailure> {
  const { requireEmailConfirmed = false } = options;

  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return {
        error: NextResponse.json({ error: 'not_authenticated' }, { status: 401 }),
      };
    }

    if (requireEmailConfirmed && !user.email_confirmed_at) {
      return {
        error: NextResponse.json({ error: 'email_not_verified' }, { status: 403 }),
      };
    }

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token ?? '';

    return { supabase, userId: user.id, token, user };
  } catch (err) {
    console.error('Erro ao resolver usuário via cookies:', err);
    return {
      error: NextResponse.json({ error: 'auth_error' }, { status: 500 }),
    };
  }
}

/**
 * Resolves authenticated user from an explicit Authorization Bearer header.
 * Kept for external API consumers or situations where cookies are unavailable.
 */
export async function resolveRequestUser(
  request: NextRequest,
  options: ResolveRequestUserOptions = {}
): Promise<AuthSuccess | AuthFailure> {
  const { requireEmailConfirmed = false } = options;
  const authorization = request.headers.get('authorization');
  if (!authorization || !authorization.toLowerCase().startsWith('bearer ')) {
    return {
      error: NextResponse.json({ error: 'missing_token' }, { status: 401 }),
    };
  }

  const token = authorization.slice('bearer '.length).trim();
  if (!token) {
    return {
      error: NextResponse.json({ error: 'missing_token' }, { status: 401 }),
    };
  }

  // Use admin client ONLY for token verification (getUser validates server-side)
  const adminClient = createAdminClient();
  if (!adminClient) {
    return {
      error: NextResponse.json(
        { error: 'Supabase service role não configurado.' },
        { status: 500 }
      ),
    };
  }

  try {
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data?.user) {
      return {
        error: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
      };
    }

    if (requireEmailConfirmed && !data.user.email_confirmed_at) {
      return {
        error: NextResponse.json({ error: 'email_not_verified' }, { status: 403 }),
      };
    }

    // Return a user-scoped client that enforces RLS
    const supabase = createUserScopedClient(token);
    if (!supabase) {
      return {
        error: NextResponse.json(
          { error: 'Supabase client configuration error.' },
          { status: 500 }
        ),
      };
    }

    return { supabase, userId: data.user.id, token, user: data.user };
  } catch (error) {
    console.error('Erro ao validar token do usuário:', error);
    return {
      error: NextResponse.json({ error: 'unable_to_validate_token' }, { status: 500 }),
    };
  }
}
