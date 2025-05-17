import { NextRequest, NextResponse } from "next/server";

// Importar resultados do módulo de correção (normalmente seria um DB)
// Esta é uma implementação simplificada para o exemplo
import { results } from "../../corrigir/route";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: "ID não fornecido" },
      { status: 400 }
    );
  }
  
  const result = results[id];
  
  if (!result) {
    return NextResponse.json(
      { error: "Resultado não encontrado" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ result });
}
