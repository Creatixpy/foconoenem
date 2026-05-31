import { NextRequest, NextResponse } from 'next/server';

// API para redirecionar para a página de administração
export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL('/noticias/admin', request.url));
}

// M11: Return 405 instead of redirecting POST
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use the admin page directly.' },
    { status: 405 }
  );
}
