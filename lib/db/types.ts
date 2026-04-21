/**
 * Database Types
 * Re-exports and extended types for database operations
 */

import type { Database } from '@/types/supabase';

// ============================================================================
// Table Row Types (from database)
// ============================================================================

export type Tables = Database['public']['Tables'];

// User-related
export type UserProfileRow = Tables['user_profiles']['Row'];
export type UserProfileInsert = Tables['user_profiles']['Insert'];
export type UserProfileUpdate = Tables['user_profiles']['Update'];

export type UserStatisticsRow = Tables['user_statistics']['Row'];
export type UserStatisticsInsert = Tables['user_statistics']['Insert'];
export type UserStatisticsUpdate = Tables['user_statistics']['Update'];

export type UserGoalRow = Tables['user_goals']['Row'];
export type UserGoalInsert = Tables['user_goals']['Insert'];
export type UserGoalUpdate = Tables['user_goals']['Update'];

export type UserAchievementRow = Tables['user_achievements']['Row'];
export type AchievementRow = Tables['achievements']['Row'];

// Content
export type EssayResultRow = Tables['essay_results']['Row'];
export type EssayResultInsert = Tables['essay_results']['Insert'];

export type QuizResultRow = Tables['quiz_results']['Row'];
export type QuizResultInsert = Tables['quiz_results']['Insert'];
export type GeneratedQuestionRow = Tables['generated_questions']['Row'];

export type NoticiaRow = Tables['noticias']['Row'];
export type NoticiaInsert = Tables['noticias']['Insert'];
export type NoticiaUpdate = Tables['noticias']['Update'];

export type CachedThemeRow = Tables['cached_themes']['Row'];

// System
export type AnalyticsEventRow = Tables['analytics_events']['Row'];
export type AnalyticsEventInsert = Tables['analytics_events']['Insert'];
export type RateLimitRow = Tables['rate_limits']['Row'];
export type ConfiguracaoRow = Tables['configuracoes']['Row'];

// ============================================================================
// Enums
// ============================================================================

export type EventType = Database['public']['Enums']['event_type_enum'];

export type GoalType = 'redacao_nota_minima' | 'questoes_acerto_minimo' | 'estudar_disciplina' | 'praticar_competencia';
export type EssayOrigin = 'IA' | 'Simulação';

// ============================================================================
// Application Models (transformed from DB rows)
// ============================================================================

/** User profile with snake_case to camelCase conversion */
export interface UserProfile {
  id: string;
  userId: string;
  nomeCompleto: string | null;
  avatarUrl: string | null;
  bio: string | null;
  objetivo: string | null;
  anoEnem: number | null;
  createdAt: string;
  updatedAt: string;
}

/** User statistics with normalized numeric fields */
export interface UserStatistics {
  id: string;
  userId: string;
  totalRedacoes: number;
  mediaNotaRedacao: number | null;
  melhorNotaRedacao: number | null;
  piorNotaRedacao: number | null;
  mediaCompetencia1: number | null;
  mediaCompetencia2: number | null;
  mediaCompetencia3: number | null;
  mediaCompetencia4: number | null;
  mediaCompetencia5: number | null;
  totalSimulados: number;
  totalQuestoesRespondidas: number;
  totalAcertos: number;
  totalErros: number;
  taxaAcerto: number | null;
  acertosPorDisciplina: {
    matematica: { acertos: number; total: number };
    portugues: { acertos: number; total: number };
    quimica: { acertos: number; total: number };
    fisica: { acertos: number; total: number };
    geografia: { acertos: number; total: number };
  };
  ultimaAtualizacao: string;
}

/** Essay competence evaluation */
export interface EssayCompetence {
  nota: number;
  comentario: string;
}

/** Complete essay result */
export interface EssayResult {
  id: string;
  userId: string | null;
  nota: number;
  competencia1: EssayCompetence;
  competencia2: EssayCompetence;
  competencia3: EssayCompetence;
  competencia4: EssayCompetence;
  competencia5: EssayCompetence;
  feedbackGeral: string;
  pontoFortes: string[];
  pontosAMelhorar: string[];
  redacaoOriginal: string;
  origem: EssayOrigin;
  tema: string | null;
  textoApoio1: string | null;
  textoApoio2: string | null;
  createdAt: string;
}

/** Quiz result summary */
export interface QuizResult {
  id: string;
  userId: string | null;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unansweredQuestions: number;
  score: number;
  disciplines: string[];
  createdAt: string;
}

/** News article */
export interface Noticia {
  id: string;
  titulo: string;
  slug: string;
  resumo: string;
  conteudo: string;
  imagemUrl: string | null;
  autor: string | null;
  dataPublicacao: string;
  tags: string[];
  destaque: boolean;
  fonteUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Query Options
// ============================================================================

export interface PaginationOptions {
  page?: number;
  limit?: number;
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryOptions {
  pagination?: PaginationOptions;
  sort?: SortOptions;
}

// ============================================================================
// Result Types
// ============================================================================

export interface QueryResult<T> {
  data: T;
  error: null;
}

export interface QueryError {
  data: null;
  error: {
    code: string;
    message: string;
  };
}

export type Result<T> = QueryResult<T> | QueryError;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
