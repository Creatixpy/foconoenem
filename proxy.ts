import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { getLegacyPublicRedirect, isPublicContentPath } from '@/lib/contracts/site-routing'
import { LEGACY_SITE_HOST } from '@/lib/constants/site'

export async function proxy(request: NextRequest) {
  // Self-hosted Next.js can normalize nextUrl to the server's listening host.
  const incomingHost = request.headers.get('host') ?? request.nextUrl.hostname
  const publicUrl = new URL(request.nextUrl)
  publicUrl.hostname = LEGACY_SITE_HOST
  const destination = incomingHost.toLowerCase() === LEGACY_SITE_HOST
    ? getLegacyPublicRedirect(publicUrl, request.method)
    : null
  if (destination) return NextResponse.redirect(destination, 301)
  if (isPublicContentPath(request.nextUrl.pathname)) return NextResponse.next()

  return await updateSession(request)
}

export const config = {
  matcher: [
    '/',
    '/sobre',
    '/privacidade',
    '/termos',
    '/noticias',
    '/noticias/:slug',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth/:path*',
    '/conta/:path*',
    '/redacao/:path*',
    '/questoes/:path*',
    '/resultados/:path*',
    '/noticias/admin',
    '/api/conta/:path*',
    '/api/corrigir',
    '/api/gerar-tema',
    '/api/noticias/admin/:path*',
    '/api/noticias/destaques/status',
    '/api/noticias/importar',
    '/api/ocr',
    '/api/perfil',
    '/api/questoes',
  ],
}
