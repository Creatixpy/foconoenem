import { supabase, withSupabaseTimeout } from "./supabase";

/**
 * Tipos de eventos rastreados
 */
export type EventType = 
  | 'essay_submitted'
  | 'essay_viewed'
  | 'theme_generated'
  | 'theme_cached'
  | 'quiz_started'
  | 'quiz_completed'
  | 'page_view'
  | 'error_occurred';

/**
 * Interface para metadados do evento
 */
interface EventMetadata {
  [key: string]: string | number | boolean | null | undefined | string[] | number[];
}

/**
 * Registra um evento de analytics
 */
export async function trackEvent(
  eventType: EventType,
  metadata?: EventMetadata,
  userIp?: string,
  userAgent?: string,
  userId?: string | null
): Promise<void> {
  try {
    const mergedMetadata = userId ? { ...(metadata ?? {}), user_id: userId } : metadata;
    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          event_type: eventType,
          metadata: mergedMetadata || {},
          user_ip: userIp,
          user_agent: userAgent,
          user_id: userId ?? null,
        })
        .abortSignal(signal);
      
      if (error) {
        throw error;
      }
    });
  } catch (error) {
    // Não falhar a aplicação se analytics falhar
    console.error("Erro ao registrar evento:", error);
  }
}

/**
 * Interface para evento de analytics
 */
interface AnalyticsEvent {
  id: string;
  event_type: string;
  metadata: Record<string, unknown>;
  user_ip: string | null;
  user_agent: string | null;
  created_at: string;
}

/**
 * Busca estatísticas de eventos
 */
export async function getEventStats(
  eventType?: EventType,
  startDate?: Date,
  endDate?: Date
): Promise<AnalyticsEvent[]> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      let query = supabase
        .from('analytics_events')
        .select('*');
      
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      
      const { data, error } = await query
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      if (error) throw error;
      return data ?? [];
    });
    
    return data;
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return [];
  }
}

/**
 * Conta eventos por tipo
 */
export async function countEventsByType(
  startDate?: Date,
  endDate?: Date
): Promise<Record<string, number>> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      let query = supabase
        .from('analytics_events')
        .select('event_type');
      
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }
      
      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }
      
      const { data, error } = await query.abortSignal(signal);
      if (error) throw error;
      return data ?? [];
    });
    
    const counts: Record<string, number> = {};
    data.forEach((event: { event_type: string }) => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1;
    });
    
    return counts;
  } catch (error) {
    console.error("Erro ao contar eventos:", error);
    return {};
  }
}

/**
 * Limpa eventos antigos (mais de 90 dias)
 */
export async function cleanupOldEvents(): Promise<void> {
  try {
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    
    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('analytics_events')
        .delete()
        .lt('created_at', ninetyDaysAgo)
        .abortSignal(signal);
      
      if (error) {
        console.error("Erro ao limpar eventos antigos:", error);
      }
    });
  } catch (error) {
    console.error("Erro ao limpar eventos antigos:", error);
  }
}
