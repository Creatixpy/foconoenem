import 'server-only';

import { logAdminAction } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';

type MaintenanceTaskName =
  | 'rate_limits'
  | 'analytics_events'
  | 'cached_themes'
  | 'quiz_attempts';

type MaintenanceTaskResult = {
  deleted: number;
  ran: boolean;
};

async function runTask(task: MaintenanceTaskName): Promise<MaintenanceTaskResult> {
  const client = createAdminClient();
  if (!client) {
    return { deleted: 0, ran: false };
  }

  try {
    const { data, error } = await client
      .rpc('run_maintenance_task', { p_task: task })
      .maybeSingle();

    if (error) throw error;
    if (!data?.ran) return { deleted: 0, ran: false };

    await logAdminAction(client, {
      adminEmail: 'system',
      action: 'maintenance_run',
      details: {
        task,
        deleted: data.deleted,
        ranAt: data.ran_at,
      },
    });

    return { deleted: data.deleted, ran: true };
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

export async function cleanupQuizAttemptsIfDue() {
  return runTask('quiz_attempts');
}
