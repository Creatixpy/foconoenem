import 'server-only';

import type { User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export async function getServerUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ?? null;
}

export async function requireServerUser(loginPath: string = '/login'): Promise<User> {
  const user = await getServerUser();
  if (!user) {
    redirect(loginPath);
  }

  return user;
}
