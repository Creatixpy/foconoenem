import { NextRequest, NextResponse } from 'next/server';
import { supabase, withSupabaseTimeout } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    const tag = searchParams.get('tag');
    const destaque = searchParams.get('destaque');
    
    let query = supabase.from('noticias').select('*');
    
    // Filtrar por tag se fornecida
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    
    // Filtrar por destaque se fornecido
    if (destaque === 'true') {
      query = query.eq('destaque', true);
    }
    
    // Ordenar, limitar e pagina
    const { data, error } = await withSupabaseTimeout(async (signal) =>
      query
        .order('data_publicacao', { ascending: false })
        .range(offset, offset + limit - 1)
        .abortSignal(signal)
    );
    
    if (error) {
      console.error('Erro ao buscar notícias:', error);
      return NextResponse.json({ error: 'Falha ao buscar notícias' }, { status: 500 });
    }
    
    return NextResponse.json({ noticias: data });
  } catch (error) {
    console.error('Erro na API de notícias:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
