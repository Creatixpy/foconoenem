'use server';

import { createAdminClient } from '@/lib/db';

const NOTICIA_FIELDS =
  'id,titulo,slug,resumo,conteudo,imagem_url,autor,data_publicacao,tags,destaque,created_at,fonte_url';

function requireSupabaseAdmin() {
  const client = createAdminClient();
  if (!client) {
    throw new Error('Supabase service role não configurado.');
  }
  return client;
}

export async function listNoticias(options: {
  limit: number;
  offset: number;
  tag?: string | null;
  destaque?: boolean;
}) {
  const { limit, offset, tag, destaque } = options;
  const supabase = requireSupabaseAdmin();

  let query = supabase.from('noticias').select(NOTICIA_FIELDS).order('data_publicacao', { ascending: false });

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
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase.from('noticias').select(NOTICIA_FIELDS).eq('slug', slug).maybeSingle();
  if (error) {
    throw error;
  }
  return data ?? null;
}

export async function searchNoticias(termo: string, limit: number) {
  const supabase = requireSupabaseAdmin();
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
    throw error;
  }

  return data ?? [];
}

export async function fetchNoticiasPorTag(tag: string, limit: number) {
  const supabase = requireSupabaseAdmin();
  const { data, error } = await supabase
    .from('noticias')
    .select(NOTICIA_FIELDS)
    .contains('tags', [tag])
    .order('data_publicacao', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data ?? [];
}
