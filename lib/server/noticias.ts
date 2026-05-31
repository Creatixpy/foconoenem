import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';

const NOTICIA_FIELDS =
  'id,titulo,slug,resumo,conteudo,imagem_url,autor,data_publicacao,tags,destaque,created_at,fonte_url,status';
const NEWS_CACHE_SECONDS = 300;

export function isNewsServerClientConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function requireNewsServerClient(): SupabaseClient<Database> {
  if (!isNewsServerClientConfigured()) {
    throw new Error('Supabase service role não configurado para notícias.');
  }

  const client = createAdminClient();
  if (!client) {
    throw new Error('Supabase service role não configurado para notícias.');
  }

  return client;
}

async function listNoticiasQuery(options: {
  limit: number;
  offset: number;
  tag?: string | null;
  destaque?: boolean;
}) {
  const { limit, offset, tag, destaque } = options;
  const supabase = requireNewsServerClient();

  const runQuery = async (highlightFilter?: boolean) => {
    let query = supabase
      .from('noticias')
      .select(NOTICIA_FIELDS)
      .eq('status', 'aprovado')
      .order('data_publicacao', { ascending: false });

    if (tag) {
      query = query.contains('tags', [tag]);
    }

    if (typeof highlightFilter === 'boolean') {
      query = query.eq('destaque', highlightFilter);
    }

    const { data, error } = await query.range(offset, offset + limit - 1);
    if (error) {
      throw error;
    }

    return data ?? [];
  };

  const noticias = await runQuery(destaque);
  if (destaque === true && noticias.length === 0) {
    return runQuery(undefined);
  }

  return noticias;
}

const listNoticiasCached = unstable_cache(
  async (limit: number, offset: number, tag: string | null, destaque: boolean | null) =>
    listNoticiasQuery({
      limit,
      offset,
      tag,
      destaque: destaque ?? undefined,
    }),
  ['public-noticias-list'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function listNoticias(options: {
  limit: number;
  offset: number;
  tag?: string | null;
  destaque?: boolean;
}) {
  return listNoticiasCached(
    options.limit,
    options.offset,
    options.tag ?? null,
    typeof options.destaque === 'boolean' ? options.destaque : null
  );
}

async function fetchNoticiaBySlugQuery(slug: string) {
  const supabase = requireNewsServerClient();
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

const fetchNoticiaBySlugCached = unstable_cache(
  async (slug: string) => fetchNoticiaBySlugQuery(slug),
  ['public-noticia-by-slug'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function fetchNoticiaBySlug(slug: string) {
  return fetchNoticiaBySlugCached(slug);
}

async function searchNoticiasQuery(termo: string, limit: number) {
  const supabase = requireNewsServerClient();
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

const searchNoticiasCached = unstable_cache(
  async (termo: string, limit: number) => searchNoticiasQuery(termo, limit),
  ['public-noticias-search'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function searchNoticias(termo: string, limit: number) {
  return searchNoticiasCached(termo, limit);
}

async function fetchNoticiasPorTagQuery(tag: string, limit: number) {
  const supabase = requireNewsServerClient();
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

const fetchNoticiasPorTagCached = unstable_cache(
  async (tag: string, limit: number) => fetchNoticiasPorTagQuery(tag, limit),
  ['public-noticias-by-tag'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function fetchNoticiasPorTag(tag: string, limit: number) {
  return fetchNoticiasPorTagCached(tag, limit);
}
