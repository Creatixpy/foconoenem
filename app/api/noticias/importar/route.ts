import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db';
import {
  fetchNewsApiArticles,
  mapArticleToRecord,
  dedupeBySlug,
  findExistingSlugs,
  insertNewsRecords,
  type NewsApiArticle,
} from '@/lib/news-import';

const NEWS_API_ENDPOINT = 'https://newsapi.org/v2/everything';

const KEYWORDS = ['enem', 'educação', 'educacao', 'vestibular', 'inep', 'mec'];

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

  let articles: NewsApiArticle[];
  try {
    articles = await fetchNewsApiArticles({
      apiKey,
      keywords: KEYWORDS,
      endpoint: NEWS_API_ENDPOINT,
    });
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
    console.error("Supabase service role client não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.");
    return NextResponse.json(
      { error: "Serviço indisponível para importação de notícias. Verifique as variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY." },
      { status: 500 }
    );
  }

  const uniqueRecords = dedupeBySlug(mappedRecords);

  if (uniqueRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: articles.length,
      message: 'Nenhuma notícia válida encontrada na resposta da NewsAPI.',
    });
  }

  if (uniqueRecords.length < mappedRecords.length) {
    console.info(
      `Importação de notícias: ${mappedRecords.length - uniqueRecords.length} itens descartados por slug duplicado dentro da mesma consulta.`
    );
  }

  const existingSlugs = await findExistingSlugs(supabaseAdmin, uniqueRecords.map((record) => record.slug));

  const freshRecords = uniqueRecords.filter((record) => !existingSlugs.has(record.slug));

  if (freshRecords.length === 0) {
    return NextResponse.json({
      imported: 0,
      skipped: uniqueRecords.length,
      message: 'Todas as notícias retornadas já estão cadastradas.',
    });
  }

  let insertedCount = 0;
  try {
    insertedCount = await insertNewsRecords(supabaseAdmin, freshRecords);
  } catch (insertError) {
    console.error('Erro ao inserir notícias:', insertError);
    return NextResponse.json(
      {
        error: 'Falha ao salvar notícias no banco de dados.',
        details: insertError instanceof Error ? insertError.message : null,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    imported: insertedCount,
    skipped: uniqueRecords.length - freshRecords.length,
    totalConsulta: articles.length,
    details: {
      mode: authResult.mode,
    },
  });
}
