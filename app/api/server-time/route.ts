import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Obtendo a hora atual do servidor
    const serverTime = new Date();
    
    // Verificamos se existe um cabeçalho de cache para evitar caching da resposta
    return NextResponse.json(
      { 
        serverTime: serverTime.toISOString(),
        timestamp: serverTime.getTime() 
      },
      { 
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        } 
      }
    );
  } catch (error) {
    console.error("Erro ao obter horário do servidor:", error);
    return NextResponse.json(
      { error: "Erro interno ao obter horário do servidor" },
      { status: 500 }
    );
  }
}
