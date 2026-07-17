import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  DISCIPLINES,
  generatedQuestionSchema,
  normalizeText,
  type CanonicalQuestion,
  type Discipline,
  type QuizResult,
} from '@/lib/contracts/quiz';
import { parseQuizResult, QuizResultMappingError } from '@/lib/contracts/quiz-result';
import type { Database, Json } from '@/types/supabase';
import { DatabaseError, withTimeout } from '@/lib/db/query';

type GeneratedQuestionRow = Database['public']['Tables']['generated_questions']['Row'];
type QuizResultRow = Database['public']['Tables']['quiz_results']['Row'];

export class QuizRepositoryError extends Error {
  constructor(
    public readonly kind: 'not_found' | 'expired' | 'invalid' | 'conflict' | 'database',
    message: string
  ) {
    super(message);
    this.name = 'QuizRepositoryError';
  }
}

function mapRpcError(error: { code?: string; message: string }): QuizRepositoryError {
  const kind =
    error.code === 'P0002'
      ? 'not_found'
      : error.code === 'P0003'
        ? 'expired'
        : error.code === 'P0004' || error.code === '22023'
          ? 'invalid'
          : error.code === 'P0005' || error.code === '23505'
            ? 'conflict'
            : 'database';

  return new QuizRepositoryError(kind, error.message);
}

function normalizeQuestionRow(row: GeneratedQuestionRow): CanonicalQuestion {
  const parsed = generatedQuestionSchema.safeParse({
    discipline: row.discipline,
    text: row.content,
    alternatives: row.alternatives,
    explanation: row.explanation,
    ...(row.topic ? { topic: row.topic } : {}),
    ...(row.difficulty ? { difficulty: row.difficulty } : {}),
  });

  if (!parsed.success || !parsed.data.discipline) {
    throw new QuizRepositoryError('database', 'O catálogo contém uma questão inválida.');
  }

  return {
    ...parsed.data,
    id: row.id,
    discipline: parsed.data.discipline,
  };
}

export function getQuestionSignature(
  question: Pick<CanonicalQuestion, 'discipline' | 'text' | 'alternatives'>
): string {
  const alternatives = question.alternatives
    .map((alternative) => `${alternative.id}:${normalizeText(alternative.text)}:${alternative.isCorrect}`)
    .join('|');
  return `${normalizeText(question.discipline)}::${normalizeText(question.text)}::${alternatives}`;
}

export async function getBalancedQuestions(
  client: SupabaseClient<Database>,
  disciplines: Discipline[],
  limitPerDiscipline = 30
): Promise<Record<Discipline, CanonicalQuestion[]>> {
  const grouped = Object.fromEntries(
    DISCIPLINES.map((discipline) => [discipline, [] as CanonicalQuestion[]])
  ) as Record<Discipline, CanonicalQuestion[]>;

  if (disciplines.length === 0) return grouped;

  const rows = await withTimeout(async (signal) => {
    const { data, error } = await client
      .rpc('get_balanced_questions', {
        p_disciplines: disciplines,
        p_limit_per_discipline: limitPerDiscipline,
      })
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return (data ?? []) as GeneratedQuestionRow[];
  }, 'fast');

  for (const row of rows) {
    const question = normalizeQuestionRow(row);
    if (question.discipline in grouped) grouped[question.discipline].push(question);
  }

  return grouped;
}

export async function upsertGeneratedQuestions(
  client: SupabaseClient<Database>,
  questions: CanonicalQuestion[]
): Promise<CanonicalQuestion[]> {
  return Promise.all(
    questions.map(async ({ id: _id, ...question }) => {
      const { data, error } = await client.rpc('upsert_generated_question', {
        p_question: question as unknown as Json,
      });
      if (error) throw mapRpcError(error);
      if (!data) throw new QuizRepositoryError('database', 'A questão não foi persistida.');
      return normalizeQuestionRow(data as GeneratedQuestionRow);
    })
  );
}

export async function getAttemptByRequestId(
  client: SupabaseClient<Database>,
  userId: string,
  requestId: string
): Promise<{ id: string; expiresAt: string; questions: CanonicalQuestion[] } | null> {
  const { data: attempt, error: attemptError } = await client
    .from('quiz_attempts')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('request_id', requestId)
    .maybeSingle();

  if (attemptError) throw DatabaseError.fromPostgrestError(attemptError);
  if (!attempt) return null;

  const { data: links, error: linksError } = await client
    .from('quiz_attempt_questions')
    .select('position, generated_questions(*)')
    .eq('attempt_id', attempt.id)
    .order('position', { ascending: true });

  if (linksError) throw DatabaseError.fromPostgrestError(linksError);

  const questions = (links ?? []).map((link) => {
    const row = link.generated_questions;
    if (!row || Array.isArray(row)) {
      throw new QuizRepositoryError('database', 'A tentativa contém uma referência inválida.');
    }
    return normalizeQuestionRow(row as GeneratedQuestionRow);
  });

  return { id: attempt.id, expiresAt: attempt.expires_at, questions };
}

export async function createQuizAttempt(
  client: SupabaseClient<Database>,
  input: { userId: string; requestId: string; questions: CanonicalQuestion[] }
) {
  const { data, error } = await client.rpc('create_quiz_attempt', {
    p_user_id: input.userId,
    p_request_id: input.requestId,
    p_question_ids: input.questions.map((question) => question.id),
  });

  if (error) throw mapRpcError(error);
  if (!data) throw new QuizRepositoryError('database', 'A tentativa não foi criada.');
  return data;
}

export async function submitQuizAttempt(
  client: SupabaseClient<Database>,
  input: { attemptId: string; userId: string; selectedAnswers: Record<string, string> }
): Promise<QuizResult> {
  const { data, error } = await client.rpc('submit_quiz_attempt', {
    p_attempt_id: input.attemptId,
    p_user_id: input.userId,
    p_selected_answers: input.selectedAnswers as Json,
  });

  if (error) throw mapRpcError(error);
  if (!data) throw new QuizRepositoryError('database', 'O resultado não foi persistido.');
  try {
    return parseQuizResult(data as QuizResultRow);
  } catch (error) {
    if (error instanceof QuizResultMappingError) {
      throw new QuizRepositoryError('database', error.message);
    }
    throw error;
  }
}
