import { supabase } from "./supabase";

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
  [key: string]: any;
}

/**
 * Registra um evento de analytics
 */
export async function trackEvent(
  eventType: EventType,
  metadata?: EventMetadata,
  userIp?: string,
  userAgent?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        metadata: metadata || {},
        user_ip: userIp,
        user_agent: userAgent
      });
    
    if (error) {
      console.error("Erro ao registrar evento:", error);
    }
  } catch (error) {
    // Não falhar a aplicação se analytics falhar
    console.error("Erro ao registrar evento:", error);
  }
}

/**
 * Busca estatísticas de eventos
 */
export async function getEventStats(
  eventType?: EventType,
  startDate?: Date,
  endDate?: Date
): Promise<any[]> {
  try {
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
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar estatísticas:", error);
      return [];
    }
    
    return data || [];
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
    let query = supabase
      .from('analytics_events')
      .select('event_type');
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    
    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error || !data) {
      return {};
    }
    
    // Contar eventos por tipo
    const counts: Record<string, number> = {};
    data.forEach((event: any) => {
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
    
    const { error } = await supabase
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo);
    
    if (error) {
      console.error("Erro ao limpar eventos antigos:", error);
    }
  } catch (error) {
    console.error("Erro ao limpar eventos antigos:", error);
  }
}
