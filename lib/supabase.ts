import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getNoticias(limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .order('data_publicacao', { ascending: false })
    .range(offset, offset + limit - 1);
  
  if (error) {
    console.error('Erro ao buscar notícias:', error);
    return [];
  }
  
  return data || [];
}

export async function getNoticiasPorTag(tag: string, limit = 10) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .contains('tags', [tag])
    .order('data_publicacao', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar notícias por tag:', error);
    return [];
  }
  
  return data || [];
}

export async function getNoticiasDestaque(limit = 3) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('destaque', true)
    .order('data_publicacao', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar notícias em destaque:', error);
    return [];
  }
  
  return data || [];
}

export async function getNoticiaPorSlug(slug: string) {
  if (!slug) {
    console.error('Erro: slug não fornecido');
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // PGRST116 = not found
        console.log(`Notícia com slug "${slug}" não encontrada`);
        return null;
      }
      
      console.error('Erro ao buscar notícia por slug:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Exceção ao buscar notícia por slug:', error);
    return null;
  }
}

export async function getNoticiasPorPesquisa(termo: string, limit = 10) {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .or(`titulo.ilike.%${termo}%,conteudo.ilike.%${termo}%,resumo.ilike.%${termo}%`)
    .order('data_publicacao', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar notícias por termo:', error);
    return [];
  }
  
  return data || [];
}

export async function verificarStatusDestaques() {
  try {
    // Verificar quando foi a última atualização
    const { data: configData, error: configError } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'ultima_atualizacao_destaques')
      .single();
    
    if (configError && configError.code !== 'PGRST116') {
      console.error("Erro ao verificar status dos destaques:", configError);
      return {
        ultimaAtualizacao: null,
        proxima: null,
        status: 'error'
      };
    }
    
    if (!configData) {
      return {
        ultimaAtualizacao: null,
        proxima: null,
        status: 'never'
      };
    }
    
    const ultimaAtualizacao = new Date(configData.valor);
    const agora = new Date();
    
    // Calcular próxima atualização (última + 12 horas)
    const proximaAtualizacao = new Date(ultimaAtualizacao);
    proximaAtualizacao.setHours(proximaAtualizacao.getHours() + 12);
    
    return {
      ultimaAtualizacao: ultimaAtualizacao.toISOString(),
      proxima: proximaAtualizacao.toISOString(),
      status: agora > proximaAtualizacao ? 'pending' : 'updated'
    };
  } catch (error) {
    console.error("Erro ao verificar status dos destaques:", error);
    return {
      ultimaAtualizacao: null,
      proxima: null,
      status: 'error'
    };
  }
}
