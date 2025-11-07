import { NextRequest, NextResponse } from 'next/server';
import { getNoticiasPorPesquisa } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!termo) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }
    
    const noticias = await getNoticiasPorPesquisa(termo, limit);
    
    return NextResponse.json({ noticias });
  } catch (error) {
    console.error('Erro na API de busca de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
