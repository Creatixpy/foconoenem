import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    
    if (!slug) {
      return NextResponse.json({ error: 'Slug não fornecido' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('noticias')
      .select('*')
      .eq('slug', slug)
      .single();
    
    if (error) {
      console.error('Erro ao buscar notícia:', error);
      return NextResponse.json({ error: 'Notícia não encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({ noticia: data });
  } catch (error) {
    console.error('Erro na API de notícia por slug:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
