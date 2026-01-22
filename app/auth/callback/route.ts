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
      // Create user profile if it doesn't exist
      // Note: We use the same supabase client which now has the session
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        try {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single()

          if (!profile) {
            const nomeCompleto = user.user_metadata?.nome_completo ||
                                user.user_metadata?.full_name ||
                                user.email?.split('@')[0] || 'Usuário';
            const objetivo = user.user_metadata?.objetivo;

            await supabase
              .from('user_profiles')
              .upsert({
                user_id: user.id,
                nome_completo: nomeCompleto,
                objetivo: objetivo || null,
              }, { onConflict: 'user_id' });

            await supabase
              .from('user_statistics')
              .upsert({ user_id: user.id }, { onConflict: 'user_id' });
          }
        } catch (profileError) {
          console.warn('Profile creation failed (non-critical):', profileError)
        }
      }

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
