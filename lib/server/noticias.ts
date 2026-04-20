'use server';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const NOTICIA_FIELDS =
  'id,titulo,slug,resumo,conteudo,imagem_url,autor,data_publicacao,tags,destaque,created_at,fonte_url,status';

function requireReadonlyClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase público não configurado.');
  }

  return createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function listNoticias(options: {
  limit: number;
  offset: number;
  tag?: string | null;
  destaque?: boolean;
}) {
  const { limit, offset, tag, destaque } = options;
  const supabase = requireReadonlyClient();

  let query = supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .eq('status', 'aprovado')
    .order('data_publicacao', { ascending: false });

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (typeof destaque === 'boolean') {
    query = query.eq('destaque', destaque);
  }

  const { data, error } = await query.range(offset, offset + limit - 1);
  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchNoticiaBySlug(slug: string) {
  const supabase = requireReadonlyClient();
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .eq('slug', slug)
    .eq('status', 'aprovado')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data ?? null;
}

export async function searchNoticias(termo: string, limit: number) {
  const supabase = requireReadonlyClient();
  const sanitizedTerm = termo.trim();

  if (!sanitizedTerm) {
    return [];
  }

  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .eq('status', 'aprovado')
    .textSearch('search_vector', sanitizedTerm, {
      type: 'websearch',
      config: 'portuguese',
    })
    .order('data_publicacao', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function fetchNoticiasPorTag(tag: string, limit: number) {
  const supabase = requireReadonlyClient();
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .eq('status', 'aprovado')
    .contains('tags', [tag])
    .order('data_publicacao', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
