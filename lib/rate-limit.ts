import { supabase } from "./supabase";

/**
 * Verifica se o usuário pode fazer uma requisição (rate limiting)
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number = 5,
  windowMinutes: number = 1
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    // Buscar registros existentes na janela de tempo
    const { data: existingRecords, error: fetchError } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString());
    
    if (fetchError) {
      console.error("Erro ao verificar rate limit:", fetchError);
      // Em caso de erro, permitir a requisição
      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: new Date(Date.now() + windowMinutes * 60 * 1000)
      };
    }
    
    const totalRequests = existingRecords?.length || 0;
    
    if (totalRequests >= maxRequests) {
      // Limite excedido
      const oldestRecord = existingRecords[0];
      const resetAt = new Date(new Date(oldestRecord.window_start).getTime() + windowMinutes * 60 * 1000);
      
      return {
        allowed: false,
        remaining: 0,
        resetAt
      };
    }
    
    // Registrar nova requisição
    const { error: insertError } = await supabase
      .from('rate_limits')
      .insert({
        identifier,
        endpoint,
        request_count: 1,
        window_start: new Date().toISOString()
      });
    
    if (insertError) {
      console.error("Erro ao registrar rate limit:", insertError);
    }
    
    return {
      allowed: true,
      remaining: maxRequests - totalRequests - 1,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000)
    };
  } catch (error) {
    console.error("Erro no rate limiting:", error);
    // Em caso de erro, permitir a requisição
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(Date.now() + windowMinutes * 60 * 1000)
    };
  }
}

/**
 * Limpa registros antigos de rate limit (mais de 1 hora)
 */
export async function cleanupOldRateLimits(): Promise<void> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('rate_limits')
      .delete()
      .lt('window_start', oneHourAgo);
    
    if (error) {
      console.error("Erro ao limpar rate limits antigos:", error);
    }
  } catch (error) {
    console.error("Erro ao limpar rate limits antigos:", error);
  }
}

/**
 * Obtém informações de rate limit para um identificador
 */
export async function getRateLimitInfo(
  identifier: string,
  endpoint: string,
  windowMinutes: number = 1
): Promise<{ count: number; oldestRequest: Date | null }> {
  try {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
    
    const { data, error } = await supabase
      .from('rate_limits')
      .select('*')
      .eq('identifier', identifier)
      .eq('endpoint', endpoint)
      .gte('window_start', windowStart.toISOString())
      .order('window_start', { ascending: true });
    
    if (error || !data) {
      return { count: 0, oldestRequest: null };
    }
    
    return {
      count: data.length,
      oldestRequest: data.length > 0 ? new Date(data[0].window_start) : null
    };
  } catch (error) {
    console.error("Erro ao obter info de rate limit:", error);
    return { count: 0, oldestRequest: null };
  }
}
