'use server';

import { NextResponse } from 'next/server';
import type { User } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/db/server';

type AuthSuccess = {
  userId: string;
  user: User;
};

type AuthFailure = {
  error: NextResponse;
};

type ResolveRequestUserOptions = {
  requireEmailConfirmed?: boolean;
};

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

    return { userId: user.id, user };
  } catch (err) {
    console.error('Erro ao resolver usuário via cookies:', err);
    return {
      error: NextResponse.json({ error: 'auth_error' }, { status: 500 }),
    };
  }
}
