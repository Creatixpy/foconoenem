import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { logAdminAction } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';

type MaintenanceTaskName = 'rate_limits' | 'analytics_events' | 'cached_themes';

type MaintenanceTaskConfig = {
  retentionMs: number;
  minIntervalMs: number;
};

type MaintenanceTaskResult = {
  deleted: number;
  ran: boolean;
};

const TASK_CONFIG: Record<MaintenanceTaskName, MaintenanceTaskConfig> = {
  rate_limits: {
    retentionMs: 60 * 60 * 1000,
    minIntervalMs: 15 * 60 * 1000,
  },
  analytics_events: {
    retentionMs: 90 * 24 * 60 * 60 * 1000,
    minIntervalMs: 6 * 60 * 60 * 1000,
  },
  cached_themes: {
    retentionMs: 7 * 24 * 60 * 60 * 1000,
    minIntervalMs: 12 * 60 * 60 * 1000,
  },
};

function getTaskConfigKey(task: MaintenanceTaskName) {
  return `maintenance:${task}:last_run_at`;
}

async function isTaskDue(
  client: SupabaseClient<Database>,
  task: MaintenanceTaskName,
  minIntervalMs: number
) {
  const { data, error } = await client
    .from('configuracoes')
    .select('valor')
    .eq('chave', getTaskConfigKey(task))
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data?.valor) {
    return true;
  }

  const lastRun = new Date(data.valor);
  if (Number.isNaN(lastRun.getTime())) {
    return true;
  }

  return Date.now() - lastRun.getTime() >= minIntervalMs;
}

async function markTaskRun(
  client: SupabaseClient<Database>,
  task: MaintenanceTaskName,
  at: string
) {
  const { error } = await client.from('configuracoes').upsert(
    {
      chave: getTaskConfigKey(task),
      valor: at,
    },
    { onConflict: 'chave' }
  );

  if (error) {
    throw error;
  }
}

async function cleanupTable(
  client: SupabaseClient<Database>,
  table: 'rate_limits' | 'analytics_events' | 'cached_themes',
  column: 'window_start' | 'created_at',
  retentionMs: number
) {
  const threshold = new Date(Date.now() - retentionMs).toISOString();
  const { error, count } = await client
    .from(table)
    .delete({ count: 'exact' })
    .lt(column, threshold);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function runTask(task: MaintenanceTaskName): Promise<MaintenanceTaskResult> {
  const client = createAdminClient();
  if (!client) {
    return { deleted: 0, ran: false };
  }

  const config = TASK_CONFIG[task];

  let due = false;
  try {
    due = await isTaskDue(client, task, config.minIntervalMs);
  } catch (error) {
    console.error(`Erro ao verificar janela de manutenção de ${task}:`, error);
    return { deleted: 0, ran: false };
  }

  if (!due) {
    return { deleted: 0, ran: false };
  }

  try {
    const deleted =
      task === 'rate_limits'
        ? await cleanupTable(client, 'rate_limits', 'window_start', config.retentionMs)
        : task === 'analytics_events'
          ? await cleanupTable(client, 'analytics_events', 'created_at', config.retentionMs)
          : await cleanupTable(client, 'cached_themes', 'created_at', config.retentionMs);

    const nowIso = new Date().toISOString();
    await markTaskRun(client, task, nowIso);

    await logAdminAction(client, {
      adminEmail: 'system',
      action: 'maintenance_run',
      details: {
        task,
        deleted,
        ranAt: nowIso,
      },
    });

    return { deleted, ran: true };
  } catch (error) {
    console.error(`Erro ao executar manutenção local de ${task}:`, error);
    return { deleted: 0, ran: false };
  }
}

export async function cleanupRateLimitsIfDue() {
  return runTask('rate_limits');
}

export async function cleanupAnalyticsIfDue() {
  return runTask('analytics_events');
}

export async function cleanupCachedThemesIfDue() {
  return runTask('cached_themes');
}
