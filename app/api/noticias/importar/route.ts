import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { authorizeAdmin } from '@/lib/admin-auth';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { withSupabaseTimeout } from '@/lib/supabase';

type NewsApiArticle = {
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

type NewsApiResponse =
  | { status: 'ok'; totalResults: number; articles: NewsApiArticle[] }
  | { status: 'error'; code?: string; message?: string };

const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';

const KEYWORDS = ['enem', 'educação', 'educacao', 'vestibular', 'inep', 'mec'];

function slugify(value: string): string {
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

  if (haystack.includes('enem')) {
    tags.add('ENEM');
  }

  if (haystack.includes('vestibular')) {
    tags.add('Vestibular');
  }

  if (haystack.includes('inep')) {
    tags.add('INEP');
  }

  if (haystack.includes('mec')) {
    tags.add('MEC');
  }

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
    const sanitizedContent = article.content.replace(/\[\+\d+\schars]/i, '').trim();
    if (sanitizedContent) {
      paragraphs.add(sanitizedContent);
    }
  }

  const html = Array.from(paragraphs)
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`);

  if (article.url) {
    const fonte = escapeHtml(article.url);
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
  if (!article.title) {
    return null;
  }

  const base = slugify(article.title);
  const uniqueFragmentSource = article.url ?? article.publishedAt ?? article.title;
  const uniqueHash = createHash('sha256').update(uniqueFragmentSource).digest('hex').slice(0, 8);
  return `${base}-${uniqueHash}`;
}

function mapArticleToRecord(article: NewsApiArticle) {
  if (!article.title || !article.publishedAt) {
    return null;
  }

  const slug = buildSlug(article);
  if (!slug) {
    return null;
  }

  const resumo = buildResumo(article);
  const conteudo = buildContent(article);

  return {
    titulo: article.title,
    slug,
    resumo,
    conteudo,
    imagem_url: article.urlToImage,
    autor: (article.author || article.source?.name || 'Agência de notícias').slice(0, 255),
    data_publicacao: new Date(article.publishedAt).toISOString(),
    tags: buildTags(article),
    destaque: false,
    fonte_url: article.url ?? null,
  };
}

export async function POST(request: NextRequest) {
  const authResult = await authorizeAdmin(request, { allowCron: true });

  if (!authResult.authorized) {
    return NextResponse.json(
      {
        error: authResult.message ?? 'Acesso não autorizado.',
      },
      { status: authResult.status ?? 401 }
    );
  }

  const apiKey = process.env.NEWSAPI_API_KEY ?? process.env.NEWSAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'NEWSAPI_API_KEY não configurada. Defina a variável de ambiente com a chave da NewsAPI.' },
      { status: 500 }
    );
  }

  const daysAgo = new Date();
  daysAgo.setDate(daysAgo.getDate() - 7);

  const url = new URL(NEWS_API_ENDPOINT);
  url.searchParams.set('q', KEYWORDS.map((keyword) => `"${keyword}"`).join(' OR '));
  url.searchParams.set('language', 'pt');
  url.searchParams.set('sortBy', 'publishedAt');
  url.searchParams.set('searchIn', 'title,description,content');
  url.searchParams.set('from', daysAgo.toISOString());
  url.searchParams.set('pageSize', '40');

  let payload: NewsApiResponse;

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'X-Api-Key': apiKey,
      },
      cache: 'no-store',
    });

    payload = (await response.json()) as NewsApiResponse;
  } catch (error) {
    console.error('Falha ao consultar a NewsAPI:', error);
    return NextResponse.json(
      { error: 'Não foi possível consultar a NewsAPI no momento.' },
      { status: 502 }
    );
  }

  if (payload.status !== 'ok') {
    console.error('Resposta inesperada da NewsAPI:', payload);
    return NextResponse.json(
      {
        error: 'A NewsAPI retornou um erro.',
        details: payload.message ?? payload.code ?? 'erro_desconhecido',
      },
      { status: 502 }
    );
  }

  const mappedRecords = payload.articles
    .map(mapArticleToRecord)
    .filter((record): record is NonNullable<ReturnType<typeof mapArticleToRecord>> => Boolean(record?.titulo && record?.slug));

  const supabaseAdmin = await getSupabaseAdmin();

  if (!supabaseAdmin) {
    console.error("Supabase service role client não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    return NextResponse.json(
      { error: "Serviço indisponível para importação de notícias. Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const uniqueRecords: typeof mappedRecords = [];
  const seenSlugs = new Set<string>();

  for (const record of mappedRecords) {
    if (!seenSlugs.has(record.slug)) {
      seenSlugs.add(record.slug);
      uniqueRecords.push(record);
    }
  }

  if (uniqueRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: payload.articles.length,
      message: 'Nenhuma notícia válida encontrada na resposta da NewsAPI.',
    });
  }

  if (uniqueRecords.length < mappedRecords.length) {
    console.info(
      `Importação de notícias: ${mappedRecords.length - uniqueRecords.length} itens descartados por slug duplicado dentro da mesma consulta.`
    );
  }

  const slugs = uniqueRecords.map((record) => record.slug);

  const { data: existing, error: existingError } = await withSupabaseTimeout(async (signal) =>
    supabaseAdmin
      .from('noticias')
      .select('slug')
      .in('slug', slugs)
      .abortSignal(signal)
  );

  if (existingError) {
    console.error('Erro ao verificar notícias existentes:', existingError);
    return NextResponse.json({ error: 'Falha ao verificar duplicidades.' }, { status: 500 });
  }

  const existingSlugs = new Set(existing?.map((item) => item.slug) ?? []);
  const freshRecords = uniqueRecords.filter((record) => !existingSlugs.has(record.slug));

  if (freshRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: uniqueRecords.length,
      message: 'Todas as notícias retornadas já estão cadastradas.',
    });
  }

  const { data: inserted, error: insertError } = await withSupabaseTimeout(async (signal) =>
    supabaseAdmin
      .from('noticias')
      .insert(freshRecords)
      .select('id, slug')
      .abortSignal(signal)
  );

  if (insertError) {
    console.error('Erro ao inserir notícias:', insertError);
    return NextResponse.json(
      {
        error: 'Falha ao salvar notícias no banco de dados.',
        details: insertError.message ?? insertError.code ?? null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    imported: inserted?.length ?? 0,
    skipped: uniqueRecords.length - freshRecords.length,
    totalConsulta: payload.articles.length,
    details: {
      mode: authResult.mode,
    },
  });
}
