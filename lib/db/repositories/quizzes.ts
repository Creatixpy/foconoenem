/**
 * Quiz Repository
 * Database operations for quiz results
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import { withTimeout, DatabaseError } from '../client';

// ============================================================================
// Quiz Result Operations
// ============================================================================

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
): Promise<void> {
  await withTimeout(async (signal) => {
    const { error } = await client
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
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}

export async function saveGeneratedQuestions(
  client: SupabaseClient<Database>,
  questions: Array<{
    id: string;
    discipline: string;
    text: string;
    alternatives: unknown;
    explanation: string;
  }>
): Promise<void> {
  const rows = questions.map(q => ({
    id: q.id,
    discipline: q.discipline,
    content: q.text,
    alternatives: q.alternatives as Json,
    explanation: q.explanation,
    created_at: new Date().toISOString(),
  }));

  await withTimeout(async (signal) => {
    const { error } = await client
      .from('generated_questions')
      .insert(rows)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
  });
}
