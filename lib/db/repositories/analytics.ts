/**
 * Analytics Repository
 * Database operations for analytics events and rate limiting
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withTimeout, DatabaseError } from '../client';
import type { EventType, AnalyticsEventInsert } from '../types';

// ============================================================================
// Analytics Events
// ============================================================================

export async function trackEvent(
  client: SupabaseClient<Database>,
  event: {
    eventType: EventType;
    metadata?: Record<string, unknown>;
    userId?: string | null;
    userIp?: string | null;
    userAgent?: string | null;
  }
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('analytics_events')
      .insert({
        event_type: event.eventType,
        metadata: event.metadata ?? {},
        user_id: event.userId ?? null,
        user_ip: event.userIp ?? null,
        user_agent: event.userAgent ?? null,
      } as AnalyticsEventInsert)
      .abortSignal(signal);

    if (error) {
      console.warn('Failed to track analytics event:', error);
    }
  }, 'fast').catch(() => {
    // Silently fail - analytics should not break the app
  });
}

export async function getEventCounts(
  client: SupabaseClient<Database>,
  options?: {
    eventType?: EventType;
    since?: Date;
    userId?: string;
  }
): Promise<number> {
  const data = await withTimeout(async (signal) => {
    let query = client
      .from('analytics_events')
      .select('*', { count: 'exact', head: true });

    if (options?.eventType) {
      query = query.eq('event_type', options.eventType);
    }

    if (options?.since) {
      query = query.gte('created_at', options.since.toISOString());
    }

    if (options?.userId) {
      query = query.eq('user_id', options.userId);
    }

    const { count, error } = await query.abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return count ?? 0;
  });

  return data;
}

// ============================================================================
// Rate Limiting
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

export async function checkRateLimit(
  client: SupabaseClient<Database>,
  identifier: string,
  endpoint: string,
  maxRequests: number
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: false })
      .limit(1)
      .abortSignal(signal)
      .maybeSingle();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  }, 'fast');

  const currentCount = data?.request_count ?? 0;
  const remaining = Math.max(0, maxRequests - currentCount);
  const resetAt = data ? new Date(new Date(data.window_start).getTime() + RATE_LIMIT_WINDOW_MS) : new Date(Date.now() + RATE_LIMIT_WINDOW_MS);

  return {
    allowed: currentCount < maxRequests,
    remaining,
    resetAt,
  };
}

export async function incrementRateLimit(
  client: SupabaseClient<Database>,
  identifier: string,
  endpoint: string
): Promise<void> {
  await withTimeout(async (signal) => {
    // C08: Use upsert to avoid check-then-act race condition.
    // Insert a new row; on conflict (same identifier+endpoint in current window),
    // increment the count atomically.
    const { error } = await client
      .from('rate_limits')
      .upsert(
        {
          identifier,
          endpoint,
          request_count: 1,
          window_start: new Date().toISOString(),
        },
        { onConflict: 'identifier,endpoint' }
      )
      .abortSignal(signal);

    if (error) {
      // Fallback: try simple insert if upsert fails (no unique constraint)
      const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
      const { data: existing } = await client
        .from('rate_limits')
        .select('id, request_count')
        .eq('identifier', identifier)
        .eq('endpoint', endpoint)
        .gte('window_start', windowStart.toISOString())
        .abortSignal(signal)
        .maybeSingle();

      if (existing) {
        await client
          .from('rate_limits')
          .update({ request_count: existing.request_count + 1 })
          .eq('id', existing.id)
          .abortSignal(signal);
      } else {
        await client
          .from('rate_limits')
          .insert({
            identifier,
            endpoint,
            request_count: 1,
            window_start: new Date().toISOString(),
          })
          .abortSignal(signal);
      }
    }
  }, 'fast').catch((err) => {
    console.warn('Failed to increment rate limit:', err);
  });
}

export async function cleanupOldRateLimits(
  client: SupabaseClient<Database>
): Promise<number> {
  const data = await withTimeout(async (signal) => {
    const { error } = await client
      .rpc('cleanup_old_rate_limits')
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return 0; // RPC doesn't return affected count
  }, 'extended');

  return data;
}

// ============================================================================
// System Configuration
// ============================================================================

export async function getConfig(
  client: SupabaseClient<Database>,
  key: string
): Promise<string | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('configuracoes')
      .select('valor')
      .eq('chave', key)
      .abortSignal(signal)
      .maybeSingle();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data?.valor ?? null;
  }, 'fast');

  return data;
}

export async function setConfig(
  client: SupabaseClient<Database>,
  key: string,
  value: string
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('configuracoes')
      .upsert(
        { chave: key, valor: value },
        { onConflict: 'chave' }
      )
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  }, 'fast');
}
