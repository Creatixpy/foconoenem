import { NextRequest, NextResponse } from 'next/server';
import { listNoticias } from '@/lib/server/noticias';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '10', 10));
    const offset = Math.max(0, parseInt(searchParams.get('offset') || '0', 10));
    const tag = searchParams.get('tag');
    const destaqueParam = searchParams.get('destaque');
    const destaque = destaqueParam === null ? undefined : destaqueParam === 'true';

    const noticias = await listNoticias({
      limit,
      offset,
      tag,
      destaque,
    });

    return NextResponse.json({ noticias });
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
