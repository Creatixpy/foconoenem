import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { runQuery } from '@/lib/db/query';
import type { Database } from '@/types/supabase';

type Client = SupabaseClient<Database>;
const NEWS_FIELDS =
  'id,titulo,slug,resumo,conteudo,imagem_url,autor,data_publicacao,tags,destaque,created_at,fonte_url,status';

function approvedNews(client: Client) {
  return client.from('noticias').select(NEWS_FIELDS).eq('status', 'aprovado');
}

function orderedNews(client: Client) {
  return approvedNews(client)
    .order('data_publicacao', { ascending: false })
    .order('id', { ascending: false });
}

export type NewsListOptions = {
  limit: number;
  offset: number;
  tag?: string | null;
  destaque?: boolean;
};

export async function listApprovedNews(client: Client, options: NewsListOptions) {
  const { limit, offset, tag, destaque } = options;
  const list = async (highlightFilter?: boolean) => {
    const data = await runQuery((signal) => {
      let query = orderedNews(client);
      if (tag) query = query.contains('tags', [tag]);
      if (typeof highlightFilter === 'boolean') query = query.eq('destaque', highlightFilter);
      return query.range(offset, offset + limit - 1).abortSignal(signal);
    });
    return data ?? [];
  };

  const news = await list(destaque);
  return destaque === true && news.length === 0 ? list() : news;
}

export function getApprovedNewsBySlug(client: Client, slug: string) {
  return runQuery((signal) => approvedNews(client)
    .eq('slug', slug)
    .abortSignal(signal)
    .maybeSingle());
}

export async function searchApprovedNews(client: Client, term: string, limit: number) {
  const sanitizedTerm = term.trim();
  if (!sanitizedTerm) return [];

  const data = await runQuery((signal) => orderedNews(client)
    .textSearch('search_vector', sanitizedTerm, { type: 'websearch', config: 'portuguese' })
    .limit(limit)
    .abortSignal(signal));
  return data ?? [];
}

export async function getApprovedNewsByTag(client: Client, tag: string, limit: number) {
  const data = await runQuery((signal) => orderedNews(client)
    .contains('tags', [tag])
    .limit(limit)
    .abortSignal(signal));
  return data ?? [];
}
