'use server';

import { type EventType } from '@/lib/db';
import { createAdminClient } from '@/lib/db/server';
import { cleanupAnalyticsIfDue } from '@/lib/server/local-maintenance';
import type { Json } from '@/types/supabase';

type TrackEventParams = {
  eventType: EventType;
  metadata: Record<string, unknown>;
  userIp?: string;
  userAgent?: string;
  userId?: string | null;
};

export async function trackEvent({ eventType, metadata, userIp, userAgent, userId }: TrackEventParams) {
  await cleanupAnalyticsIfDue();

  const supabase = createAdminClient();
  if (!supabase) {
    return;
  }

  try {
    const mergedMetadata = userId ? { ...metadata, user_id: userId } : metadata;
    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      metadata: mergedMetadata as Json,
      user_ip: userIp ?? null,
      user_agent: userAgent ?? null,
      user_id: userId ?? null,
    });

    if (error) {
      console.error('Erro ao registrar evento de analytics:', error);
    }
  } catch (error) {
    console.error('Erro inesperado ao registrar evento:', error);
  }
}
