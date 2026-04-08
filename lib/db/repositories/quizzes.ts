/**
 * Quiz Repository
 * Database operations for quiz results
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { withTimeout, DatabaseError } from '../client';
import { toQuizResult } from '../transformers';
import type { QuizResult, QuizResultRow } from '../types';

// ============================================================================
// Quiz Result Operations
// ============================================================================

export async function getQuizById(
  client: SupabaseClient<Database>,
  quizId: string,
  userId?: string
): Promise<QuizResultRow | null> {
  const data = await withTimeout(async (signal) => {
    let query = client
      .from('quiz_results')
      .select('*')
      .eq('id', quizId);

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query.abortSignal(signal).maybeSingle();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return data;
}

export async function getUserQuizzes(
  client: SupabaseClient<Database>,
  userId: string,
  options?: { limit?: number; offset?: number }
): Promise<QuizResult[]> {
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;

  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data.map((row) => toQuizResult(row as QuizResultRow));
}

export async function createQuizResult(
  client: SupabaseClient<Database>,
  userId: string,
  quiz: {
    totalQuestions: number;
    correctAnswers: number;
    wrongAnswers: number;
    unansweredQuestions: number;
    score: number;
    disciplines: string[];
    questionsData: unknown;
    answersData: unknown;
  }
): Promise<QuizResult> {
  const result = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('quiz_results')
      .insert({
        user_id: userId,
        total_questions: quiz.totalQuestions,
        correct_answers: quiz.correctAnswers,
        wrong_answers: quiz.wrongAnswers,
        unanswered_questions: quiz.unansweredQuestions,
        score: quiz.score,
        disciplines: quiz.disciplines,
        questions_data: quiz.questionsData as Json,
        answers_data: quiz.answersData as Json,
      })
      .select()
      .abortSignal(signal)
      .single();

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data;
  });

  return toQuizResult(result as QuizResultRow);
}

export async function getQuizStats(
  client: SupabaseClient<Database>,
  userId: string
): Promise<{
  total: number;
  totalQuestions: number;
  totalCorrect: number;
  averageScore: number | null;
}> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('quiz_results')
      .select('total_questions, correct_answers, score')
      .eq('user_id', userId)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  if (data.length === 0) {
    return { total: 0, totalQuestions: 0, totalCorrect: 0, averageScore: null };
  }

  const total = data.length;
  const totalQuestions = data.reduce((sum, row) => sum + row.total_questions, 0);
  const totalCorrect = data.reduce((sum, row) => sum + row.correct_answers, 0);
  const averageScore = totalQuestions > 0 ? (totalCorrect / totalQuestions) * 100 : null;

  return { total, totalQuestions, totalCorrect, averageScore };
}

export async function getQuizzesByDiscipline(
  client: SupabaseClient<Database>,
  userId: string,
  discipline: string
): Promise<QuizResultRow[]> {
  const data = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('quiz_results')
      .select('*')
      .eq('user_id', userId)
      .contains('disciplines', [discipline])
      .order('created_at', { ascending: false })
      .limit(50)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  });

  return data;
}
