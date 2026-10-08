import 'server-only';

import { createAdminClient } from '@/lib/db/server';
import { cleanupRateLimitsIfDue } from '@/lib/server/local-maintenance';
import { runQuery } from '@/lib/db/query';

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

  try {
    const data = await runQuery((signal) => supabase
      .rpc('consume_rate_limit', {
        p_identifier: identifier,
        p_endpoint: endpoint,
        p_max_requests: maxRequests,
        p_window_minutes: windowMinutes,
      })
      .abortSignal(signal)
      .maybeSingle(), 'fast');

    if (!data) throw new Error('Empty rate limit result');
    const parsedResetAt = new Date(data.reset_at);

    return {
      allowed: data.allowed,
      remaining: data.remaining,
      resetAt: Number.isNaN(parsedResetAt.getTime()) ? resetAt : parsedResetAt,
    };
  } catch (error) {
    console.error('Rate limiter: atomic DB operation failed — failing closed:', error);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }
}
