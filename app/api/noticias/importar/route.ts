import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, logAdminAction } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';
import {
  fetchNewsApiArticles,
  mapArticleToRecord,
  dedupeBySlug,
  findExistingSlugs,
  insertNewsRecords,
  type NewsApiArticle,
} from '@/lib/news-import';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';
const NEWSAPI_TIMEOUT_MS = 30_000;

const KEYWORDS = ['enem', 'educação', 'educacao', 'vestibular', 'inep', 'mec'];

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request, { allowMissingOriginForAuthHeader: true });
  if (originError) {
    return originError;
  }

  const authResult = await authorizeAdmin(request, { allowCron: true });

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: 'Acesso não autorizado.' },
      { status: authResult.status ?? 401 }
    );
  }

  const apiKey = process.env.NEWSAPI_API_KEY ?? process.env.NEWSAPI_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'Chave da NewsAPI não configurada.' },
      { status: 500 }
    );
  }

  let articles: NewsApiArticle[];
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), NEWSAPI_TIMEOUT_MS);
    articles = await fetchNewsApiArticles({
      apiKey,
      keywords: KEYWORDS,
      endpoint: NEWS_API_ENDPOINT,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (error) {
    console.error('Falha ao consultar a NewsAPI:', error);
    return NextResponse.json(
      { error: 'Não foi possível consultar a NewsAPI no momento.' },
      { status: 502 }
    );
  }

  const mappedRecords = articles
    .map(mapArticleToRecord)
    .filter((record): record is NonNullable<ReturnType<typeof mapArticleToRecord>> => Boolean(record?.titulo && record?.slug));

  const supabaseAdmin = createAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: 'Serviço indisponível.' },
      { status: 500 }
    );
  }

  const uniqueRecords = dedupeBySlug(mappedRecords);

  if (uniqueRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: articles.length,
      message: 'Nenhuma notícia válida encontrada.',
    });
  }

  const existingSlugs = await findExistingSlugs(supabaseAdmin, uniqueRecords.map((record) => record.slug));

  const freshRecords = uniqueRecords.filter((record) => !existingSlugs.has(record.slug));

  if (freshRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: uniqueRecords.length,
      message: 'Todas as notícias já estão cadastradas.',
    });
  }

  let insertedCount = 0;
  try {
    insertedCount = await insertNewsRecords(supabaseAdmin, freshRecords);
  } catch (insertError) {
    console.error('Erro ao inserir notícias:', insertError);
    return NextResponse.json(
      { error: 'Falha ao salvar notícias.' },
      { status: 500 }
    );
  }

  const adminEmail = authResult.mode === 'user' ? authResult.user?.email ?? null : 'cron';
  await logAdminAction(supabaseAdmin, {
    adminEmail,
    action: 'news_import',
    details: {
      imported: insertedCount,
      skipped: uniqueRecords.length - freshRecords.length,
      totalConsulta: articles.length,
    },
  });

  return NextResponse.json({
    imported: insertedCount,
    skipped: uniqueRecords.length - freshRecords.length,
    totalConsulta: articles.length,
    details: { mode: authResult.mode },
  });
}
