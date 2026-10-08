import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { unstable_cache } from 'next/cache';
import { createAdminClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';
import {
  getApprovedNewsBySlug,
  getApprovedNewsByTag,
  listApprovedNews,
  searchApprovedNews,
  type NewsListOptions,
} from '@/lib/db/repositories/news';

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

const listNoticiasCached = unstable_cache(
  async (limit: number, offset: number, tag: string | null, destaque: boolean | null) =>
    listApprovedNews(requireNewsServerClient(), {
      limit,
      offset,
      tag,
      destaque: destaque ?? undefined,
    }),
  ['public-noticias-list'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function listNoticias(options: NewsListOptions) {
  return listNoticiasCached(
    options.limit,
    options.offset,
    options.tag ?? null,
    typeof options.destaque === 'boolean' ? options.destaque : null
  );
}

const fetchNoticiaBySlugCached = unstable_cache(
  async (slug: string) => getApprovedNewsBySlug(requireNewsServerClient(), slug),
  ['public-noticia-by-slug'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function fetchNoticiaBySlug(slug: string) {
  return fetchNoticiaBySlugCached(slug);
}

const searchNoticiasCached = unstable_cache(
  async (termo: string, limit: number) => searchApprovedNews(requireNewsServerClient(), termo, limit),
  ['public-noticias-search'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function searchNoticias(termo: string, limit: number) {
  return searchNoticiasCached(termo, limit);
}

const fetchNoticiasPorTagCached = unstable_cache(
  async (tag: string, limit: number) => getApprovedNewsByTag(requireNewsServerClient(), tag, limit),
  ['public-noticias-by-tag'],
  { revalidate: NEWS_CACHE_SECONDS, tags: ['public-noticias'] }
);

export async function fetchNoticiasPorTag(tag: string, limit: number) {
  return fetchNoticiasPorTagCached(tag, limit);
}
