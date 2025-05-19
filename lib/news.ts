import { supabase } from './supabase';
import { News, NewsPreview } from '@/types/news';

/**
 * Busca todas as notícias ordenadas por data de publicação
 */
export async function getAllNews(): Promise<NewsPreview[]> {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, slug, description, image_url, published_at, category, featured')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('Erro ao buscar notícias:', error);
    return [];
  }

  return data as NewsPreview[];
}

/**
 * Busca notícias em destaque
 */
export async function getFeaturedNews(limit: number = 3): Promise<NewsPreview[]> {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, slug, description, image_url, published_at, category, featured')
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Erro ao buscar notícias em destaque:', error);
    return [];
  }

  return data as NewsPreview[];
}

/**
 * Busca uma notícia específica pelo slug
 */
export async function getNewsBySlug(slug: string): Promise<News | null> {
  const { data, error } = await supabase
    .from('news')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    console.error(`Erro ao buscar notícia com slug ${slug}:`, error);
    return null;
  }

  return data as News;
}

/**
 * Busca notícias por categoria
 */
export async function getNewsByCategory(category: string): Promise<NewsPreview[]> {
  const { data, error } = await supabase
    .from('news')
    .select('id, title, slug, description, image_url, published_at, category, featured')
    .eq('category', category)
    .order('published_at', { ascending: false });

  if (error) {
    console.error(`Erro ao buscar notícias da categoria ${category}:`, error);
    return [];
  }

  return data as NewsPreview[];
}

/**
 * Busca as categorias disponíveis
 */
export async function getCategories(): Promise<string[]> {
  const { data, error } = await supabase
    .from('news')
    .select('category')
    .order('category');

  if (error) {
    console.error('Erro ao buscar categorias:', error);
    return [];
  }

  // Extrair categorias únicas
  const categories = [...new Set(data.map((item: { category: any }) => item.category))];
  return categories;
}
