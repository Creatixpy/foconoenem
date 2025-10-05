import { supabase } from "./supabase";

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
    
    const { data, error } = await supabase
      .from('cached_themes')
      .select('*')
      .gte('created_at', oneDayAgo)
      .order('usado_count', { ascending: true })
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    // Incrementar contador de uso
    await supabase
      .from('cached_themes')
      .update({ usado_count: data.usado_count + 1 })
      .eq('id', data.id);
    
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
    const { error } = await supabase
      .from('cached_themes')
      .insert({
        tema,
        texto_apoio1: textoApoio1,
        texto_apoio2: textoApoio2,
        usado_count: 1
      });
    
    if (error) {
      console.error("Erro ao cachear tema:", error);
    }
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
    
    const { error } = await supabase
      .from('cached_themes')
      .delete()
      .lt('created_at', sevenDaysAgo);
    
    if (error) {
      console.error("Erro ao limpar temas antigos:", error);
    }
  } catch (error) {
    console.error("Erro ao limpar temas antigos:", error);
  }
}
