import { supabase } from "./supabase";

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

/**
 * Registra um novo usuário
 */
export async function signUp(email: string, password: string, nomeCompleto?: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nome_completo: nomeCompleto,
      }
    }
  });
  
  if (error) throw error;
  
  // Criar perfil do usuário
  if (data.user) {
    await createUserProfile(data.user.id, nomeCompleto);
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
export async function signInWithGoogle() {
  // Usa a URL de produção para evitar problemas de redirect_uri_mismatch
  const redirectTo = process.env.NODE_ENV === 'production'
    ? 'https://foconoenem.vercel.app/auth/callback'
    : `${window.location.origin}/auth/callback`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
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
      await createUserProfile(data.session.user.id, nomeCompleto);
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
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Erro ao buscar perfil:', error);
    return null;
  }
  
  return data;
}

/**
 * Cria perfil do usuário
 */
export async function createUserProfile(userId: string, nomeCompleto?: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      nome_completo: nomeCompleto || null,
    })
    .select()
    .single();
  
  if (error) {
    console.error('Erro ao criar perfil:', error);
    throw error;
  }
  
  // Criar estatísticas iniciais
  await supabase
    .from('user_statistics')
    .insert({
      user_id: userId,
    });
  
  return data;
}

/**
 * Atualiza perfil do usuário
 */
export async function updateUserProfile(userId: string, updates: Partial<UserProfile>) {
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Obtém estatísticas do usuário
 */
export async function getUserStatistics(userId: string): Promise<UserStatistics | null> {
  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return null;
  }
  
  return data;
}

/**
 * Recalcula e atualiza estatísticas do usuário
 */
export async function recalculateUserStatistics(userId: string) {
  try {
    // Buscar todas as redações do usuário
    const { data: essays } = await supabase
      .from('essay_results')
      .select('*')
      .eq('user_id', userId);
    
    // Buscar todos os quizzes do usuário
    const { data: quizzes } = await supabase
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId);
    
    // Calcular estatísticas de redação
    const essayStats = essays && essays.length > 0 ? {
      total_redacoes: essays.length,
      media_nota_redacao: essays.reduce((sum, e) => sum + e.nota, 0) / essays.length,
      melhor_nota_redacao: Math.max(...essays.map(e => e.nota)),
      pior_nota_redacao: Math.min(...essays.map(e => e.nota)),
      media_competencia1: essays.reduce((sum, e) => sum + e.competencia1.nota, 0) / essays.length,
      media_competencia2: essays.reduce((sum, e) => sum + e.competencia2.nota, 0) / essays.length,
      media_competencia3: essays.reduce((sum, e) => sum + e.competencia3.nota, 0) / essays.length,
      media_competencia4: essays.reduce((sum, e) => sum + e.competencia4.nota, 0) / essays.length,
      media_competencia5: essays.reduce((sum, e) => sum + e.competencia5.nota, 0) / essays.length,
    } : {};
    
    // Calcular estatísticas de questões
    let quizStats = {};
    if (quizzes && quizzes.length > 0) {
      const totalQuestoes = quizzes.reduce((sum, q) => sum + q.total_questions, 0);
      const totalAcertos = quizzes.reduce((sum, q) => sum + q.correct_answers, 0);
      const totalErros = quizzes.reduce((sum, q) => sum + q.wrong_answers, 0);
      
      // Contar por disciplina
      const disciplineStats: Record<string, { acertos: number; total: number }> = {
        'Matemática': { acertos: 0, total: 0 },
        'Português': { acertos: 0, total: 0 },
        'Química': { acertos: 0, total: 0 },
        'Física': { acertos: 0, total: 0 },
        'Geografia': { acertos: 0, total: 0 },
      };
      
      quizzes.forEach(quiz => {
        const questions = quiz.questions_data || [];
        const answers = quiz.answers_data || {};
        
        questions.forEach((q: { discipline: string; id: string; alternatives: Array<{id: string; isCorrect: boolean}> }) => {
          if (disciplineStats[q.discipline]) {
            disciplineStats[q.discipline].total++;
            const userAnswer = answers[q.id];
            const correctAnswer = q.alternatives.find(a => a.isCorrect);
            if (userAnswer === correctAnswer?.id) {
              disciplineStats[q.discipline].acertos++;
            }
          }
        });
      });
      
      quizStats = {
        total_simulados: quizzes.length,
        total_questoes_respondidas: totalQuestoes,
        total_acertos: totalAcertos,
        total_erros: totalErros,
        taxa_acerto: totalQuestoes > 0 ? (totalAcertos / totalQuestoes) * 100 : 0,
        acertos_matematica: disciplineStats['Matemática'].acertos,
        total_matematica: disciplineStats['Matemática'].total,
        acertos_portugues: disciplineStats['Português'].acertos,
        total_portugues: disciplineStats['Português'].total,
        acertos_quimica: disciplineStats['Química'].acertos,
        total_quimica: disciplineStats['Química'].total,
        acertos_fisica: disciplineStats['Física'].acertos,
        total_fisica: disciplineStats['Física'].total,
        acertos_geografia: disciplineStats['Geografia'].acertos,
        total_geografia: disciplineStats['Geografia'].total,
      };
    }
    
    // Atualizar estatísticas no banco
    const { error } = await supabase
      .from('user_statistics')
      .upsert({
        user_id: userId,
        ...essayStats,
        ...quizStats,
        ultima_atualizacao: new Date().toISOString(),
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error('Erro ao recalcular estatísticas:', error);
    return false;
  }
}

/**
 * Obtém metas do usuário
 */
export async function getUserGoals(userId: string): Promise<UserGoal[]> {
  const { data, error } = await supabase
    .from('user_goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Cria uma nova meta
 */
export async function createUserGoal(userId: string, goal: Partial<UserGoal>) {
  const { data, error } = await supabase
    .from('user_goals')
    .insert({
      user_id: userId,
      ...goal,
    })
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Atualiza uma meta
 */
export async function updateUserGoal(goalId: string, updates: Partial<UserGoal>) {
  const { data, error } = await supabase
    .from('user_goals')
    .update(updates)
    .eq('id', goalId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Deleta uma meta
 */
export async function deleteUserGoal(goalId: string) {
  const { error } = await supabase
    .from('user_goals')
    .delete()
    .eq('id', goalId);
  
  if (error) throw error;
  return true;
}
