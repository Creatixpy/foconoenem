/**
 * News Repository
 * Database operations for news articles
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { withTimeout, DatabaseError, isNotFoundError } from '../client';
import { toNoticia, fromNoticiaInsert } from '../transformers';
import type { Noticia, NoticiaRow, PaginatedResult } from '../types';

// ============================================================================
// News Operations
// ============================================================================

export async function getNoticiaBySlug(
  client: SupabaseClient<Database>,
  slug: string
): Promise<Noticia | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .select('*')
      .eq('slug', slug)
      .maybeSingle()
      .abortSignal(signal);

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data ? toNoticia(data as NoticiaRow) : null;
}

export async function getNoticiaById(
  client: SupabaseClient<Database>,
  id: string
): Promise<Noticia | null> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .select('*')
      .eq('id', id)
      .maybeSingle()
      .abortSignal(signal);

    if (error && !isNotFoundError(error)) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data ? toNoticia(data as NoticiaRow) : null;
}

export async function listNoticias(
  client: SupabaseClient<Database>,
  options?: {
    limit?: number;
    page?: number;
    destaque?: boolean;
    tag?: string;
  }
): Promise<PaginatedResult<Noticia>> {
  const limit = options?.limit ?? 20;
  const page = options?.page ?? 1;
  const offset = (page - 1) * limit;

  const { data, total } = await withTimeout(async (signal) => {
    let query = client
      .from('noticias')
      .select('*', { count: 'exact' });

    if (options?.destaque !== undefined) {
      query = query.eq('destaque', options.destaque);
    }

    if (options?.tag) {
      query = query.contains('tags', [options.tag]);
    }

    const { data, error, count } = await query
      .order('data_publicacao', { ascending: false })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return { data: data ?? [], total: count ?? 0 };
  });

  return {
    data: data.map((row) => toNoticia(row as NoticiaRow)),
    total,
    page,
    limit,
    hasMore: offset + data.length < total,
  };
}

export async function getDestaquesNoticias(
  client: SupabaseClient<Database>,
  limit: number = 5
): Promise<Noticia[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .select('*')
      .eq('destaque', true)
      .order('data_publicacao', { ascending: false })
      .limit(limit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  }, 'fast');

  return data.map((row) => toNoticia(row as NoticiaRow));
}

export async function searchNoticias(
  client: SupabaseClient<Database>,
  query: string,
  options?: { limit?: number }
): Promise<Noticia[]> {
  const limit = options?.limit ?? 20;

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .select('*')
      .textSearch('search_vector', query, { type: 'websearch', config: 'portuguese' })
      .order('data_publicacao', { ascending: false })
      .limit(limit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data.map((row) => toNoticia(row as NoticiaRow));
}

export async function createNoticia(
  client: SupabaseClient<Database>,
  noticia: Omit<Noticia, 'id' | 'createdAt' | 'updatedAt'>
): Promise<Noticia> {
  const payload = fromNoticiaInsert(noticia);

  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .insert(payload as Database['public']['Tables']['noticias']['Insert'])
      .select()
      .single()
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return toNoticia(result as NoticiaRow);
}

export async function updateNoticia(
  client: SupabaseClient<Database>,
  id: string,
  updates: Partial<Omit<Noticia, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<Noticia> {
  const dbUpdates: Record<string, unknown> = {};
  
  if (updates.titulo !== undefined) dbUpdates.titulo = updates.titulo;
  if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
  if (updates.resumo !== undefined) dbUpdates.resumo = updates.resumo;
  if (updates.conteudo !== undefined) dbUpdates.conteudo = updates.conteudo;
  if (updates.imagemUrl !== undefined) dbUpdates.imagem_url = updates.imagemUrl;
  if (updates.autor !== undefined) dbUpdates.autor = updates.autor;
  if (updates.dataPublicacao !== undefined) dbUpdates.data_publicacao = updates.dataPublicacao;
  if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
  if (updates.destaque !== undefined) dbUpdates.destaque = updates.destaque;
  if (updates.fonteUrl !== undefined) dbUpdates.fonte_url = updates.fonteUrl;

  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('noticias')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single()
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return toNoticia(result as NoticiaRow);
}

export async function setNoticiaDestaque(
  client: SupabaseClient<Database>,
  id: string,
  destaque: boolean
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('noticias')
      .update({ destaque })
      .eq('id', id)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  }, 'fast');
}

export async function deleteNoticia(
  client: SupabaseClient<Database>,
  id: string
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
      .from('noticias')
      .delete()
      .eq('id', id)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

export async function noticiaExistsBySlug(
  client: SupabaseClient<Database>,
  slug: string
): Promise<boolean> {
  const data = await withTimeout(async (signal) => {
    const { count, error } = await client
      .from('noticias')
      .select('*', { count: 'exact', head: true })
      .eq('slug', slug)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return count ?? 0;
  }, 'fast');

  return data > 0;
}
