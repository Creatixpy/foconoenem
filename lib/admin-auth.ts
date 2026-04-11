'use server';

import { timingSafeEqual } from 'node:crypto';
import type { User } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { createServerClient, createAdminClient } from '@/lib/db/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const allowedEmails = (process.env.ADMIN_ALLOWED_EMAILS ?? '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

type AdminAuthSuccess = { authorized: true; mode: 'user' | 'cron'; user?: User };
type AdminAuthFailure = { authorized: false; status: number; message: string };

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
  } catch {
    return false;
  }
}

export async function authorizeAdmin(
  request: NextRequest,
  options: { allowCron?: boolean } = {}
): Promise<AdminAuthSuccess | AdminAuthFailure> {
  const { allowCron = false } = options;

  // 1) Cron secret check (Vercel sends CRON_SECRET automatically)
  if (allowCron) {
    const secret = process.env.CRON_SECRET ?? process.env.ADMIN_CRON_SECRET;
    const cronHeader = request.headers.get('authorization')?.replace('Bearer ', '')
      ?? request.headers.get('x-cron-secret');

    if (secret && cronHeader && safeCompare(cronHeader, secret)) {
      return { authorized: true, mode: 'cron' };
    }
  }

  // 2) Cookie-based auth (primary — used by frontend)
  try {
    const supabase = await createServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (!error && user) {
      return verifyAdminEmail(user);
    }
  } catch {
    // Cookie auth not available, try Bearer fallback
  }

  // 3) Bearer token fallback (programmatic access)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice('bearer '.length).trim();
    if (token) {
      return verifyBearerToken(token);
    }
  }

  return { authorized: false, status: 401, message: 'Autenticação necessária.' };
}

function verifyAdminEmail(user: User): AdminAuthSuccess | AdminAuthFailure {
  if (allowedEmails.length === 0) {
    return {
      authorized: false,
      status: 403,
      message: 'Lista de administradores não configurada.',
    };
  }

  const email = user.email?.toLowerCase();
  if (!email || !allowedEmails.includes(email)) {
    return { authorized: false, status: 403, message: 'Acesso restrito.' };
  }

  return { authorized: true, mode: 'user', user };
}

async function verifyBearerToken(token: string): Promise<AdminAuthSuccess | AdminAuthFailure> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    return { authorized: false, status: 500, message: 'Serviço indisponível.' };
  }

  try {
    const { data, error } = await adminClient.auth.getUser(token);
    if (error || !data?.user) {
      return { authorized: false, status: 401, message: 'Autenticação necessária.' };
    }
    return verifyAdminEmail(data.user);
  } catch {
    return { authorized: false, status: 500, message: 'Erro de autenticação.' };
  }
}

// ---------------------------------------------------------------------------
// Audit logging helper
// ---------------------------------------------------------------------------

export type AuditAction =
  | 'news_import'
  | 'news_moderate'
  | 'news_delete'
  | 'highlights_update'
  | 'highlights_remove'
  | 'maintenance_run';

export async function logAdminAction(
  adminClient: SupabaseClient<Database>,
  opts: {
    adminEmail: string | null;
    action: AuditAction;
    targetType?: string;
    targetId?: string;
    details?: Record<string, unknown>;
    ip?: string | null;
  }
) {
  try {
    await adminClient.from('admin_audit_log').insert({
      admin_email: opts.adminEmail ?? 'cron',
      action: opts.action,
      target_type: opts.targetType ?? null,
      target_id: opts.targetId ?? null,
      details: (opts.details as Database['public']['Tables']['admin_audit_log']['Insert']['details']) ?? null,
      ip_address: opts.ip ?? null,
    });
  } catch (err) {
    console.error('Falha ao registrar ação no audit log:', err);
  }
}
