import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Redirecionar de /api/noticias/admin para /noticias/admin-page
  return NextResponse.redirect(new URL('/noticias/admin-page', request.url));
}
