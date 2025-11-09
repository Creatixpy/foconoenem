'use server';

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { extractUserIdFromToken } from '@/lib/server/jwt';

type AuthSuccess = {
  supabase: SupabaseClient<Database>;
  userId: string;
  token: string;
};

type AuthFailure = {
  error: NextResponse;
};

export async function resolveRequestUser(request: NextRequest): Promise<AuthSuccess | AuthFailure> {
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

  let userId = extractUserIdFromToken(token);

  if (!userId) {
    try {
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data?.user?.id) {
        return {
          error: NextResponse.json({ error: 'invalid_token' }, { status: 401 }),
        };
      }
      userId = data.user.id;
    } catch (error) {
      console.error('Erro ao validar token do usuário:', error);
      return {
        error: NextResponse.json({ error: 'unable_to_validate_token' }, { status: 500 }),
      };
    }
  }

  return { supabase, userId, token };
}
