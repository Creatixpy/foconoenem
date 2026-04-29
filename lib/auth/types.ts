/**
 * Authentication System Types
 * Type definitions for the authentication module
 */

import type { User, Session } from '@supabase/supabase-js';

// User profile from database
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

// User statistics from database
export interface UserStatistics {
  id: string;
  user_id: string;
  total_redacoes: number;
  media_nota_redacao: number | null;
  melhor_nota_redacao: number | null;
  pior_nota_redacao: number | null;
  media_competencia1: number | null;
  media_competencia2: number | null;
  media_competencia3: number | null;
  media_competencia4: number | null;
  media_competencia5: number | null;
  total_simulados: number;
  total_questoes_respondidas: number;
  total_acertos: number;
  total_erros: number;
  taxa_acerto: number | null;
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

// Authentication state
export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
}

// Sign up data
export interface SignUpData {
  email: string;
  password: string;
  nomeCompleto?: string;
  objetivo?: string;
}

// Sign in data
export interface SignInData {
  email: string;
  password: string;
}

// OAuth signup extras stored in session
export interface OAuthSignupContext {
  nomeCompleto?: string | null;
  objetivo?: string | null;
  timestamp: number;
}

// Password validation result
export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  strength: 'weak' | 'fair' | 'good' | 'strong';
}

// Auth operation result
export interface AuthResult<T = void> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

// Session info for display
export interface SessionInfo {
  id: string;
  createdAt: Date;
  lastActiveAt: Date;
  expiresAt: Date | null;
  userAgent?: string;
  ipAddress?: string;
  isCurrent: boolean;
}

// Rate limit info
export interface RateLimitInfo {
  isLimited: boolean;
  remainingAttempts: number;
  resetAt?: Date;
}

// Auth error with code
export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
