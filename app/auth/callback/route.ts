import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sanitizeRedirectPath } from '@/lib/security';

function requireSupabasePublicClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('SUPABASE_URL/SUPABASE_ANON_KEY devem estar configuradas para o callback OAuth.');
  }

  return createClient(supabaseUrl, supabaseAnonKey);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // if "next" is in param, use it as the redirect URL
  const next = sanitizeRedirectPath(searchParams.get('next') ?? '/conta', '/conta');

  if (code) {
    const supabase = requireSupabasePublicClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Verificar se o perfil existe, caso contrário criar
      const { getUserProfile, createUserProfile } = await import('@/lib/auth');
      const profile = await getUserProfile(data.user.id);

      if (!profile) {
        const nomeCompleto = data.user.user_metadata?.nome_completo ||
                            data.user.user_metadata?.full_name ||
                            data.user.email?.split('@')[0] || 'Usuário';
        const objetivo = data.user.user_metadata?.objetivo;
        await createUserProfile(data.user.id, nomeCompleto, objetivo);
      }
    }

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`);
}
