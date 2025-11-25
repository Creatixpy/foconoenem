import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const AUTH_PATHS = {
  DEFAULT_REDIRECT: '/conta',
  ERROR: '/auth/auth-code-error',
};

function sanitizeRedirectPath(value: string | undefined | null, fallback: string = '/conta'): string {
  if (!value) return fallback;
  if (!value.startsWith('/')) return fallback;
  if (value.startsWith('//')) return fallback;
  if (value.toLowerCase().includes('javascript:')) return fallback;
  return value;
}

/**
 * Creates a Supabase client for server-side auth callback
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Variáveis de ambiente do Supabase não configuradas');
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = sanitizeRedirectPath(
    searchParams.get('next'),
    AUTH_PATHS.DEFAULT_REDIRECT
  );

  if (!code) {
    console.error('OAuth callback sem código de autorização');
    return NextResponse.redirect(`${origin}${AUTH_PATHS.ERROR}`);
  }

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('Erro ao trocar código por sessão:', error.message);
      return NextResponse.redirect(`${origin}${AUTH_PATHS.ERROR}`);
    }

    if (data.user) {
      // Create profile directly without importing client-side code
      try {
        // Check if profile exists
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', data.user.id)
          .single();

        if (!profile) {
          const nomeCompleto = data.user.user_metadata?.nome_completo ||
                              data.user.user_metadata?.full_name ||
                              data.user.email?.split('@')[0] || 'Usuário';
          const objetivo = data.user.user_metadata?.objetivo;
          
          // Create user profile
          await supabase
            .from('user_profiles')
            .upsert({
              user_id: data.user.id,
              nome_completo: nomeCompleto,
              objetivo: objetivo || null,
            }, { onConflict: 'user_id' });

          // Create user statistics
          await supabase
            .from('user_statistics')
            .upsert({ user_id: data.user.id }, { onConflict: 'user_id' });
        }
      } catch (profileError) {
        // Log but don't fail - profile can be created later
        console.warn('Não foi possível criar perfil no callback:', profileError);
      }
    }

    return NextResponse.redirect(`${origin}${next}`);
  } catch (error) {
    console.error('Erro no callback OAuth:', error);
    return NextResponse.redirect(`${origin}${AUTH_PATHS.ERROR}`);
  }
}
