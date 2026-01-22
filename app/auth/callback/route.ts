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

      // Robust redirection logic:
      // 1. Prefer NEXT_PUBLIC_SITE_URL if defined (ensures consistent canonical URL)
      // 2. Fallback to origin from request (works for localhost/preview)
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || origin;

      // Ensure we don't double slashes
      const baseUrl = siteUrl.endsWith('/') ? siteUrl.slice(0, -1) : siteUrl;
      const redirectPath = next.startsWith('/') ? next : `/${next}`;

      return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
