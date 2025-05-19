import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  
  // Corrigir acesso à página de admin de notícias
  if (url.pathname === '/noticias/admin') {
    url.pathname = '/noticias/admin-page';
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/noticias/:path*'],
};
