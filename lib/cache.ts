import { supabase, withSupabaseTimeout } from "./supabase";

/**
 * Interface para tema em cache
 */
interface CachedTheme {
  id: string;
  tema: string;
  texto_apoio1: string;
  texto_apoio2: string;
  usado_count: number;
  created_at: string;
}

/**
 * Busca um tema em cache (gerado nas últimas 24h e menos usado)
 */
export async function getCachedTheme(): Promise<CachedTheme | null> {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('cached_themes')
        .select('*')
        .gte('created_at', oneDayAgo)
        .order('usado_count', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        .abortSignal(signal);
      
      if (error) {
        return null;
      }
      
      return data as CachedTheme | null;
    });
    
    if (!data) {
      return null;
    }
    
    await withSupabaseTimeout(async (signal) => {
      await supabase
        .from('cached_themes')
        .update({ usado_count: data.usado_count + 1 })
        .eq('id', data.id)
        .abortSignal(signal);
    });
    
    return data;
  } catch (error) {
    console.error("Erro ao buscar tema em cache:", error);
    return null;
  }
}

/**
 * Armazena um novo tema no cache
 */
export async function cacheTheme(
  tema: string,
  textoApoio1: string,
  textoApoio2: string
): Promise<void> {
  try {
    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('cached_themes')
        .insert({
          tema,
          texto_apoio1: textoApoio1,
          texto_apoio2: textoApoio2,
          usado_count: 1
        })
        .abortSignal(signal);
      
      if (error) {
        console.error("Erro ao cachear tema:", error);
      }
    });
  } catch (error) {
    console.error("Erro ao cachear tema:", error);
  }
}

/**
 * Limpa temas antigos do cache (mais de 7 dias)
 */
export async function cleanupOldThemes(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('cached_themes')
        .delete()
        .lt('created_at', sevenDaysAgo)
        .abortSignal(signal);
      
      if (error) {
        console.error("Erro ao limpar temas antigos:", error);
      }
    });
  } catch (error) {
    console.error("Erro ao limpar temas antigos:", error);
  }
}
