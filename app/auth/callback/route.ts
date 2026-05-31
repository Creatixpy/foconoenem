import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeRedirectPath } from '@/lib/auth/security'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/conta'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // User profile and statistics are created automatically by database triggers
      // (see on_auth_user_created trigger on auth.users)

      const redirectPath = sanitizeRedirectPath(next, '/conta');
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else {
        console.error('Auth callback error:', error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
