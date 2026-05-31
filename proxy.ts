import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
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
    '/api/destaques/:path*',
    '/api/gerar-tema',
    '/api/noticias/admin/:path*',
    '/api/noticias/destaques/status',
    '/api/noticias/importar',
    '/api/ocr',
    '/api/perfil',
    '/api/questoes',
    '/api/resultados/:path*',
  ],
}
