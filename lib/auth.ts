import { supabase, withSupabaseTimeout } from "./supabase";
import { sanitizeRedirectPath } from './security';

/**
 * Interface para dados de perfil do usuário
 */
export interface UserProfile {
  id: string;
  user_id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  bio: string | null;
  objetivo: string | null;
  ano_enem: number | null;
  community_tagline: string | null;
  community_profile_theme: string | null;
  community_show_statistics: boolean;
  community_terms_version: string | null;
  community_terms_accepted_at: string | null;
  community_age_confirmed_at: string | null;
  is_over_16: boolean | null;
  created_at: string;
  updated_at: string;
}

/**
 * Interface para estatísticas do usuário
 */
export interface UserStatistics {
  id: string;
  user_id: string;
  
  // Redação
  total_redacoes: number;
  media_nota_redacao: number | null;
  melhor_nota_redacao: number | null;
  pior_nota_redacao: number | null;
  media_competencia1: number | null;
  media_competencia2: number | null;
  media_competencia3: number | null;
  media_competencia4: number | null;
  media_competencia5: number | null;
  
  // Questões
  total_simulados: number;
  total_questoes_respondidas: number;
  total_acertos: number;
  total_erros: number;
  taxa_acerto: number | null;
  
  // Por disciplina
  acertos_matematica: number;
  total_matematica: number;
  acertos_portugues: number;
  total_portugues: number;
  acertos_quimica: number;
  total_quimica: number;
  acertos_fisica: number;
  total_fisica: number;
  acertos_geografia: number;
  total_geografia: number;
  
  ultima_atualizacao: string;
}

/**
 * Interface para metas do usuário
 */
export interface UserGoal {
  id: string;
  user_id: string;
  tipo: 'redacao_nota_minima' | 'questoes_acerto_minimo' | 'estudar_disciplina' | 'praticar_competencia';
  descricao: string;
  valor_alvo: number | null;
  disciplina: string | null;
  competencia: number | null;
  prazo: string | null;
  concluida: boolean;
  progresso: number;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  criteria: Record<string, unknown> | null;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  metadata: Record<string, unknown> | null;
  achievement?: Achievement;
}

export const COMMUNITY_TERMS_VERSION = '2024-07-community';

/**
 * Registra um novo usuário
 */
export async function signUp(email: string, password: string, nomeCompleto?: string, objetivo?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nomeCompleto,
        objetivo,
      }
    }
  });
  
  if (error) throw error;
  
  // Criar perfil do usuário (apenas se já houver sessão ativa)
  if (data.session?.user) {
    try {
      await createUserProfile(data.session.user.id, nomeCompleto, objetivo);
    } catch (profileError) {
      console.warn('Não foi possível criar o perfil imediatamente após o cadastro. Ele será criado ao confirmar o login.', profileError);
    }
  }
  
  return data;
}

/**
 * Faz login
 */
export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Faz login com Google OAuth
 */
type GoogleSignupExtras = {
  nomeCompleto?: string;
  objetivo?: string;
  redirectTo?: string;
};

export async function signInWithGoogle(extras?: GoogleSignupExtras) {
  // Usa a URL de produção para evitar problemas de redirect_uri_mismatch
  const baseRedirect = process.env.NODE_ENV === 'production'
    ? 'https://foconoenem.vercel.app/auth/callback'
    : `${window.location.origin}/auth/callback`;

  const callbackUrl = new URL(baseRedirect);
  if (extras?.redirectTo) {
    const safeNext = sanitizeRedirectPath(extras.redirectTo);
    callbackUrl.searchParams.set('next', safeNext);
  }

  if (extras?.nomeCompleto || extras?.objetivo) {
    try {
      const payload = {
        nomeCompleto: extras?.nomeCompleto ?? null,
        objetivo: extras?.objetivo ?? null,
        timestamp: Date.now(),
      };
      sessionStorage.setItem('foconoenem_signup_context', JSON.stringify(payload));
    } catch (error) {
      console.error('Erro ao salvar dados temporários de cadastro:', error);
    }
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl.toString(),
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      },
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Trata o callback do OAuth e obtém a sessão
 */
export async function handleOAuthCallback() {
  const { data, error } = await supabase.auth.getSession();

  if (error) throw error;

  if (data.session?.user) {
    // Verificar se o perfil existe, caso contrário criar
    const profile = await getUserProfile(data.session.user.id);
    if (!profile) {
      const nomeCompleto = data.session.user.user_metadata?.nome_completo ||
                          data.session.user.user_metadata?.full_name ||
                          data.session.user.email?.split('@')[0] || 'Usuário';
      const objetivo = data.session.user.user_metadata?.objetivo;
      await createUserProfile(data.session.user.id, nomeCompleto, objetivo);
    }
  }

  return data;
}

/**
 * Faz logout
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Obtém o usuário atual
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Obtém o perfil do usuário
 */
export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data as UserProfile;
    });

    return data;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
}

/**
 * Cria perfil do usuário
 */
export async function createUserProfile(userId: string, nomeCompleto?: string, objetivo?: string | null) {
  try {
    const profile = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(
          {
            user_id: userId,
            nome_completo: nomeCompleto || null,
            objetivo: objetivo ?? null,
          },
          { onConflict: 'user_id' }
        )
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('user_statistics')
        .upsert(
          { user_id: userId },
          { onConflict: 'user_id' }
        )
        .abortSignal(signal);

      if (error) throw error;
    });

    return profile;
  } catch (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }
}

/**
 * Atualiza perfil do usuário
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

export async function confirmCommunityAge(userId: string) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          is_over_16: true,
          community_age_confirmed_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao confirmar idade na comunidade:', error);
    throw error;
  }
}

export async function acceptCommunityTerms(userId: string, version: string = COMMUNITY_TERMS_VERSION) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          community_terms_version: version,
          community_terms_accepted_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao aceitar termos da comunidade:', error);
    throw error;
  }
}

type CommunitySettingsInput = {
  community_tagline?: string | null;
  community_profile_theme?: string | null;
  community_show_statistics?: boolean;
};

export async function updateCommunitySettings(userId: string, payload: CommunitySettingsInput) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('user_id', userId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar preferências da comunidade:', error);
    throw error;
  }
}

/**
 * Obtém estatísticas do usuário
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_statistics')
        .select('*')
        .eq('user_id', userId)
        .single()
        .abortSignal(signal);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data as UserStatistics | null;
    });

    if (!data) {
      return null;
    }

  const parseNumeric = (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }

    return null;
  };

  const numericFields: Array<keyof Pick<
    UserStatistics,
    | 'media_nota_redacao'
    | 'media_competencia1'
    | 'media_competencia2'
    | 'media_competencia3'
    | 'media_competencia4'
    | 'media_competencia5'
    | 'taxa_acerto'
  >> = [
    'media_nota_redacao',
    'media_competencia1',
    'media_competencia2',
    'media_competencia3',
    'media_competencia4',
    'media_competencia5',
    'taxa_acerto',
  ];

  const normalized = { ...data } as UserStatistics;
  const rawData = data as unknown as Record<string, unknown>;

  for (const field of numericFields) {
    normalized[field] = parseNumeric(rawData[field]);
  }

    return normalized;
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
}

/**
 * Recalcula e atualiza estatísticas do usuário direto no banco.
 */
export async function recalculateUserStatistics(userId: string): Promise<UserStatistics | null> {
  try {
    const { data, error } = await withSupabaseTimeout(async (signal) => {
      return await supabase
        .rpc('recalculate_user_statistics', {
          target_user_id: userId,
        })
        .abortSignal(signal);
    });

    if (error) {
      throw error;
    }

    return (data as UserStatistics) ?? null;
  } catch (error) {
    console.error('Erro ao recalcular estatísticas:', error);
    return null;
  }
}

/**
 * Obtém metas do usuário
 */
export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      if (error) throw error;
      return data ?? [];
    });

    return data;
  } catch (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
}

/**
 * Cria uma nova meta
 */
export async function createUserGoal(userId: string, goal: Partial<UserGoal>) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_goals')
        .insert({
          user_id: userId,
          tipo: goal.tipo ?? 'redacao_nota_minima',
          descricao: goal.descricao ?? 'Meta sem descrição',
          valor_alvo: goal.valor_alvo ?? null,
          disciplina: goal.disciplina ?? null,
          competencia: goal.competencia ?? null,
          prazo: goal.prazo ?? null,
          concluida: goal.concluida ?? false,
          progresso: goal.progresso ?? 0,
        })
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao criar meta:', error);
    throw error;
  }
}

/**
 * Atualiza uma meta
 */
export async function updateUserGoal(goalId: string, updates: Partial<UserGoal>) {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_goals')
        .update(updates)
        .eq('id', goalId)
        .select()
        .single()
        .abortSignal(signal);

      if (error) throw error;
      return data;
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar meta:', error);
    throw error;
  }
}

/**
 * Deleta uma meta
 */
export async function deleteUserGoal(goalId: string) {
  try {
    await withSupabaseTimeout(async (signal) => {
      const { error } = await supabase
        .from('user_goals')
        .delete()
        .eq('id', goalId)
        .abortSignal(signal);

      if (error) throw error;
    });

    return true;
  } catch (error) {
    console.error('Erro ao excluir meta:', error);
    throw error;
  }
}

export async function getUserAchievements(userId: string): Promise<UserAchievement[]> {
  try {
    const data = await withSupabaseTimeout(async (signal) => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('*, achievement:achievements(*)')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .abortSignal(signal);

      if (error) throw error;
      return (data as UserAchievement[]) ?? [];
    });

    return data;
  } catch (error) {
    console.error('Erro ao buscar badges do usuário:', error);
    return [];
  }
}
