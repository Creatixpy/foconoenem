import { NextRequest, NextResponse } from 'next/server';
import { searchNoticias } from '@/lib/server/noticias';

const CACHE_HEADERS = {
  'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=600',
};

function parseSearchLimit(value: string | null) {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed)) {
    return 10;
  }

  return Math.min(Math.max(1, parsed), 50);
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get('q');
    const limit = parseSearchLimit(searchParams.get('limit'));

    if (!termo) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }

    const noticias = await searchNoticias(termo, limit);

    return NextResponse.json({ noticias }, { headers: CACHE_HEADERS });
  } catch (error) {
    console.error('Erro na API de busca de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
