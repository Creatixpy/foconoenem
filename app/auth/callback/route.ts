import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/conta'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // User profile and statistics are created automatically by database triggers
      // (see on_auth_user_created trigger on auth.users)

      // Redirect to the same origin to maintain session context
      const redirectPath = next.startsWith('/') ? next : `/${next}`;
      return NextResponse.redirect(`${origin}${redirectPath}`);
    } else {
        console.error('Auth callback error:', error)
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
