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
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('slug', slug)
    .single();
  
  if (error) {
    console.error('Erro ao buscar notícia por slug:', error);
    return null;
  }
  
  return data;
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
