import { NextRequest, NextResponse } from 'next/server';
import { fetchNoticiaBySlug } from '@/lib/server/noticias';

export async function GET(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const slug = pathname.split('/').pop();

  if (!slug) {
    return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 });
  }

  try {
    const noticia = await fetchNoticiaBySlug(slug);
    if (!noticia) {
      return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ noticia });
  } catch (error) {
    console.error('Erro ao buscar notícia:', error);
    return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 });
  }
}
