'use server';

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

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

  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    return {
      error: NextResponse.json(
        { error: 'Supabase service role não configurado.' },
        { status: 500 }
      ),
    };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
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

    return { supabase, userId: data.user.id, token, user: data.user };
  } catch (error) {
    console.error('Erro ao validar token do usuário:', error);
    return {
      error: NextResponse.json({ error: 'unable_to_validate_token' }, { status: 500 }),
    };
  }
}
