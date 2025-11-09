'use server';

import { getSupabaseAdmin } from '@/lib/supabase-admin';

type TrackEventParams = {
  eventType: string;
  metadata: Record<string, unknown>;
  userIp?: string;
  userAgent?: string;
  userId?: string | null;
};

export async function trackEvent({ eventType, metadata, userIp, userAgent, userId }: TrackEventParams) {
  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    return;
  }

  try {
    const mergedMetadata = userId ? { ...metadata, user_id: userId } : metadata;
    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      metadata: mergedMetadata,
      user_ip: userIp,
      user_agent: userAgent,
      user_id: userId ?? null,
    });

    if (error) {
      console.error('Erro ao registrar evento de analytics:', error);
    }
  } catch (error) {
    console.error('Erro inesperado ao registrar evento:', error);
  }
}
