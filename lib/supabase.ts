import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY devem estar configuradas.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

const NOTICIA_FIELDS =
  'id,titulo,slug,resumo,conteudo,imagem_url,autor,data_publicacao,tags,destaque,created_at,fonte_url';

export async function getNoticias(limit = 10, offset = 0) {
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
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
    .select(NOTICIA_FIELDS)
    .contains('tags', [tag])
    .order('data_publicacao', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error('Erro ao buscar notícias por tag:', error);
    return [];
  }
  
  return data || [];
}

export async function getNoticiasDestaque(limit = 5) {
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
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
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error('Erro ao buscar notícia por slug:', error);
    return null;
  }
  
  return data;
}

export async function getNoticiasPorPesquisa(termo: string, limit = 10) {
  const sanitizedTerm = termo.trim();
  if (!sanitizedTerm) {
    return [];
  }

  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .textSearch('search_vector', sanitizedTerm, {
      type: 'websearch',
      config: 'portuguese',
    })
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
    
    // Calcular próxima atualização (última + 24 horas)
    const proximaAtualizacao = new Date(ultimaAtualizacao);
    proximaAtualizacao.setHours(proximaAtualizacao.getHours() + 24);
    
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
