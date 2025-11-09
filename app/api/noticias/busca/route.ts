import { NextRequest, NextResponse } from 'next/server';
import { searchNoticias } from '@/lib/server/noticias';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get('q');
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));

    if (!termo) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }

    const noticias = await searchNoticias(termo, limit);

    return NextResponse.json({ noticias });
  } catch (error) {
    console.error('Erro na API de busca de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
