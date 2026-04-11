'use server';

import { createClient } from '@supabase/supabase-js';
import type { User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

function getAdminClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL ou anon key não configurados. Defina SUPABASE_URL/SUPABASE_ANON_KEY.');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
  });
}

type AdminAuthSuccess = { authorized: true; mode: 'user' | 'cron'; user?: User };
type AdminAuthFailure = { authorized: false; status: number; message: string };

export async function authorizeAdmin(
  request: NextRequest,
  options: { allowCron?: boolean } = {}
): Promise<AdminAuthSuccess | AdminAuthFailure> {
  const { allowCron = false } = options;

  if (allowCron && process.env.ADMIN_CRON_SECRET) {
    const cronSecret =
      request.headers.get('x-cron-secret') ?? undefined;

    if (cronSecret && cronSecret === process.env.ADMIN_CRON_SECRET) {
      return { authorized: true, mode: 'cron' };
    }
  }

  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
    return { authorized: false, status: 401, message: 'Token de acesso ausente.' };
  }

  const token = authHeader.slice('bearer '.length).trim();
  if (!token) {
    return { authorized: false, status: 401, message: 'Token de acesso inválido.' };
  }

  try {
    const supabase = getAdminClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { authorized: false, status: 401, message: 'Sessão inválida ou expirada.' };
    }

    if (allowedEmails.length === 0) {
      return {
        authorized: false,
        status: 403,
        message: 'Lista de administradores não configurada. Defina ADMIN_ALLOWED_EMAILS.',
      };
    }

    const email = data.user.email?.toLowerCase();
    if (!email || !allowedEmails.includes(email)) {
      return { authorized: false, status: 403, message: 'Você não tem permissão para executar esta ação.' };
    }

    return { authorized: true, mode: 'user', user: data.user };
  } catch (error) {
    console.error('Erro ao validar token administrativo:', error);
    return { authorized: false, status: 500, message: 'Falha ao validar credenciais do administrador.' };
  }
}
