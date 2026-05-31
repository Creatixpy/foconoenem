import { NextRequest, NextResponse } from 'next/server';
import { listNoticias } from '@/lib/server/noticias';
import { refreshHighlightsIfDue } from '@/lib/server/news-highlights';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
};

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(min, parsed), max);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseBoundedInteger(searchParams.get('limit'), 10, 1, 100);
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 10_000);
    const tag = searchParams.get('tag');
    const destaqueParam = searchParams.get('destaque');
    const destaque = destaqueParam === null ? undefined : destaqueParam === 'true';

    if (destaque === true) {
      await refreshHighlightsIfDue();
    }

    const noticias = await listNoticias({
      limit,
      offset,
      tag,
      destaque,
    });

    return NextResponse.json({ noticias }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
