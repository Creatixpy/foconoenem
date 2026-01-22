import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';

async function cleanupCachedThemes() {
  const supabase = createAdminClient();
  if (!supabase) return 0;

  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('cached_themes')
    .delete({ count: 'exact' })
    .lt('created_at', threshold);

  if (error) {
    throw new Error(`Erro ao limpar cached_themes: ${error.message}`);
  }

  return count ?? 0;
}

async function cleanupRateLimits() {
  const supabase = createAdminClient();
  if (!supabase) return 0;

  const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('rate_limits')
    .delete({ count: 'exact' })
    .lt('window_start', threshold);

  if (error) {
    throw new Error(`Erro ao limpar rate_limits: ${error.message}`);
  }

  return count ?? 0;
}

async function cleanupAnalytics() {
  const supabase = createAdminClient();
  if (!supabase) return 0;

  const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('analytics_events')
    .delete({ count: 'exact' })
    .lt('created_at', threshold);

  if (error) {
    throw new Error(`Erro ao limpar analytics_events: ${error.message}`);
  }

  return count ?? 0;
}

export async function GET(request: NextRequest) {
  return handler(request);
}

export async function POST(request: NextRequest) {
  return handler(request);
}

async function handler(request: NextRequest) {
  const auth = await authorizeAdmin(request, { allowCron: true });
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message ?? 'Acesso negado.' },
      { status: auth.status ?? 401 }
    );
  }

  try {
    const [themes, rateLimits, analytics] = await Promise.all([
      cleanupCachedThemes().catch((error) => ({ error })),
      cleanupRateLimits().catch((error) => ({ error })),
      cleanupAnalytics().catch((error) => ({ error })),
    ]);

    const result = {
      status: 'completed' as const,
      deleted: {
        cached_themes: typeof themes === 'number' ? themes : 0,
        rate_limits: typeof rateLimits === 'number' ? rateLimits : 0,
        analytics_events: typeof analytics === 'number' ? analytics : 0,
      },
      errors: [] as string[],
    };

    if (typeof themes !== 'number' && themes?.error) {
      result.errors.push(themes.error instanceof Error ? themes.error.message : String(themes.error));
    }

    if (typeof rateLimits !== 'number' && rateLimits?.error) {
      result.errors.push(rateLimits.error instanceof Error ? rateLimits.error.message : String(rateLimits.error));
    }

    if (typeof analytics !== 'number' && analytics?.error) {
      result.errors.push(analytics.error instanceof Error ? analytics.error.message : String(analytics.error));
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erro ao executar manutenção:', error);
    return NextResponse.json(
      {
        error: 'Erro ao executar manutenção.',
        message: error instanceof Error ? error.message : 'Erro desconhecido.',
      },
      { status: 500 }
    );
  }
}
