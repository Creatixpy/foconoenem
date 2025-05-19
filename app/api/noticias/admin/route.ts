import { NextRequest, NextResponse } from 'next/server';

// API para redirecionar para a página de administração
export async function GET(request: NextRequest) {
  // Redirecionar de /api/noticias/admin para /noticias/admin
  return NextResponse.redirect(new URL('/noticias/admin', request.url));
}

// Exporte pelo menos uma função manipuladora de rota
export async function POST(request: NextRequest) {
  // Também redirecionar POST requests
  return NextResponse.redirect(new URL('/noticias/admin', request.url));
}
