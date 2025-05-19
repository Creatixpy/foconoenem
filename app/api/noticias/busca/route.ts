import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const termo = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!termo) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .or(`titulo.ilike.%${termo}%,conteudo.ilike.%${termo}%,resumo.ilike.%${termo}%`)
      .order('data_publicacao', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Erro ao buscar notícias por termo:', error);
      return NextResponse.json({ error: 'Falha ao buscar notícias' }, { status: 500 });
    }
    
    return NextResponse.json({ noticias: data });
  } catch (error) {
    console.error('Erro na API de busca de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
