import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  // Extrai o slug da URL
  const { pathname } = request.nextUrl;
  // Esperado: /api/noticias/[slug]
  const slug = pathname.split('/').pop();

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
}
