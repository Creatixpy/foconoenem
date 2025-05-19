import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    // Obter o ID da notícia a ser removida do destaque
    const { id } = await request.json();
    
    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
    }
    
    // Atualizar o registro no Supabase (remover destaque)
    const { error } = await supabase
      .from('noticias')
      .update({ destaque: false })
      .eq('id', id);
    
    if (error) {
      console.error('Erro ao remover destaque:', error);
      return NextResponse.json({ error: 'Erro ao remover destaque' }, { status: 500 });
    }
    
    // Retornar confirmação de sucesso
    return NextResponse.json({ success: true, message: 'Destaque removido com sucesso' });
    
  } catch (error) {
    console.error('Erro no endpoint de remoção de destaque:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
