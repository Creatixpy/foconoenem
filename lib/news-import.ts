import { createHash } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { sanitizeExternalUrl } from '@/lib/server/news-content';

export type NewsApiArticle = {
  title: string | null;
  description: string | null;
  content: string | null;
  url: string | null;
  urlToImage: string | null;
  author: string | null;
  publishedAt: string | null;
  source?: {
    id?: string | null;
    name?: string | null;
  };
};

export type NewsApiResponse =
  | { status: 'ok'; totalResults: number; articles: NewsApiArticle[] }
  | { status: 'error'; code?: string; message?: string };

export type NormalizedNewsRecord = {
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagem_url: string | null;
  autor: string;
  data_publicacao: string;
  tags: string[];
  destaque: boolean;
  fonte_url: string | null;
};

const ISO_CONTENT_REGEX = /\[\+\d+\schars]/i;

export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildTags(article: NewsApiArticle): string[] {
  const tags = new Set<string>(['Educação', 'Atualidades']);
  const haystack = [article.title, article.description, article.content]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (haystack.includes('enem')) tags.add('ENEM');
  if (haystack.includes('vestibular')) tags.add('Vestibular');
  if (haystack.includes('inep')) tags.add('INEP');
  if (haystack.includes('mec')) tags.add('MEC');

  const sourceName = article.source?.name?.trim();
  if (sourceName) {
    tags.add(sourceName);
  }

  return Array.from(tags);
}

function buildContent(article: NewsApiArticle): string {
  const paragraphs = new Set<string>();

  if (article.description) {
    paragraphs.add(article.description.trim());
  }

  if (article.content) {
    const sanitizedContent = article.content.replace(ISO_CONTENT_REGEX, '').trim();
    if (sanitizedContent) {
      paragraphs.add(sanitizedContent);
    }
  }

  const html = Array.from(paragraphs)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`);

  const sourceUrl = sanitizeExternalUrl(article.url);
  if (sourceUrl) {
    const fonte = escapeHtml(sourceUrl);
    const fonteNome = escapeHtml(article.source?.name ?? 'Notícia original');
    html.push(
      `<p><strong>Fonte:</strong> <a href="${fonte}" target="_blank" rel="noopener noreferrer">${fonteNome}</a></p>`
    );
  }

  return html.join('\n');
}

function buildResumo(article: NewsApiArticle): string {
  const base = article.description ?? article.content ?? article.title ?? '';
  return base.length > 400 ? `${base.slice(0, 397).trimEnd()}...` : base.trim();
}

function buildSlug(article: NewsApiArticle): string | null {
  if (!article.title) return null;
  const base = slugify(article.title);
  const uniqueFragmentSource = article.url ?? article.publishedAt ?? article.title;
  const uniqueHash = createHash('sha256').update(uniqueFragmentSource).digest('hex').slice(0, 8);
  return `${base}-${uniqueHash}`;
}

export function mapArticleToRecord(article: NewsApiArticle): NormalizedNewsRecord | null {
  if (!article.title || !article.publishedAt) {
    return null;
  }

  const slug = buildSlug(article);
  if (!slug) {
    return null;
  }

  const resumo = buildResumo(article);
  const conteudo = buildContent(article);

  const sourceUrl = sanitizeExternalUrl(article.url);
  const imageUrl = sanitizeExternalUrl(article.urlToImage);

  return {
    titulo: article.title,
    slug,
    resumo,
    conteudo,
    imagem_url: imageUrl,
    autor: (article.author || article.source?.name || 'Agência de notícias').slice(0, 255),
    data_publicacao: new Date(article.publishedAt).toISOString(),
    tags: buildTags(article),
    destaque: false,
    fonte_url: sourceUrl,
  };
}

export function dedupeBySlug(records: NormalizedNewsRecord[]): NormalizedNewsRecord[] {
  const seen = new Set<string>();
  const unique: NormalizedNewsRecord[] = [];

  for (const record of records) {
    if (!seen.has(record.slug)) {
      seen.add(record.slug);
      unique.push(record);
    }
  }

  return unique;
}

export async function fetchNewsApiArticles(options: {
  apiKey: string;
  keywords: string[];
  endpoint: string;
  lookbackDays?: number;
  signal?: AbortSignal;
}): Promise<NewsApiArticle[]> {
  const { apiKey, keywords, endpoint, lookbackDays = 7, signal } = options;

  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - lookbackDays);

  const url = new URL(endpoint);
  url.searchParams.set('q', keywords.map((keyword) => `"${keyword}"`).join(' OR '));
  url.searchParams.set('language', 'pt');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('searchIn', 'title,description,content');
  url.searchParams.set('from', fromDate.toISOString());
  url.searchParams.set('pageSize', '40');

  try {
    const response = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey },
      cache: 'no-store',
      signal,
    });

    const payload = (await response.json()) as NewsApiResponse;

    if (!response.ok || payload.status !== 'ok') {
      const detail = payload.status === 'error' ? payload.message ?? payload.code : 'erro_newsapi';
      throw new Error(detail ?? 'Falha ao consultar NewsAPI');
    }

    return payload.articles;
  } catch (error) {
    console.error('Falha ao consultar NewsAPI:', error);
    throw error;
  }
}

export async function findExistingSlugs(
  client: SupabaseClient<Database>,
  slugs: string[],
  signal?: AbortSignal
): Promise<Set<string>> {
  let query = client.from('noticias').select('slug').in('slug', slugs);
  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return new Set(data?.map((item) => item.slug) ?? []);
}

export async function insertNewsRecords(
  client: SupabaseClient<Database>,
  records: NormalizedNewsRecord[],
  signal?: AbortSignal
): Promise<number> {
  let query = client.from('noticias').insert(records).select('id');
  if (signal) {
    query = query.abortSignal(signal);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}
