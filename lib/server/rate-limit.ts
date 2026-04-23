'use server';

import { createAdminClient } from '@/lib/db/server';
import { cleanupRateLimitsIfDue } from '@/lib/server/local-maintenance';

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

/**
 * Server-side DB-backed rate limiter.
 * SECURITY: Fails **closed** — if the DB is unavailable, requests are denied
 * to prevent abuse of expensive AI endpoints.
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  await cleanupRateLimitsIfDue();

  const supabase = createAdminClient();
  const resetAt = new Date(Date.now() + windowMinutes * 60 * 1000);

  if (!supabase) {
    console.error('Rate limiter: admin client unavailable — failing closed');
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('rate_limits')
    .select('id, window_start')
    .eq('identifier', identifier)
    .eq('endpoint', endpoint)
    .gte('window_start', windowStart)
    .order('window_start', { ascending: true });

  if (error) {
    console.error('Rate limiter: DB query failed — failing closed:', error);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  const totalRequests = data?.length ?? 0;
  if (totalRequests >= maxRequests) {
    const oldest = data![0];
    const oldestTime = new Date(oldest.window_start ?? Date.now());
    const retryAt = new Date(oldestTime.getTime() + windowMinutes * 60 * 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt: retryAt,
    };
  }

  const { error: insertError } = await supabase.from('rate_limits').insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  if (insertError) {
    console.error('Erro ao registrar rate limit:', insertError);
  }

  return {
    allowed: true,
    remaining: maxRequests - totalRequests - 1,
    resetAt,
  };
}
