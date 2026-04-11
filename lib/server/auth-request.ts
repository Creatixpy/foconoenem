'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { createAdminClient } from '@/lib/db/server';

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
