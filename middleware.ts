import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Sentinel Security: Headers Reinforcement
  // Ensure headers are present even if next.config.ts misses them for some edge cases
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Sentinel Security: Cookie Hardening
  // Note: Actual Auth logic is likely handled by Supabase Auth Helpers in a separate file or lib,
  // but here we ensure that if we touch cookies, we're aware of the context.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
