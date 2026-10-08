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
import { DatabaseError, runQuery } from '@/lib/db/query';

type GeneratedQuestionRow = Database['public']['Tables']['generated_questions']['Row'];

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

function rethrowRpcError(error: unknown): never {
  if (error instanceof DatabaseError) throw mapRpcError(error);
  throw error;
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

  const rows = await runQuery((signal) =>
    client
      .rpc('get_balanced_questions', {
        p_disciplines: disciplines,
        p_limit_per_discipline: limitPerDiscipline,
      })
      .abortSignal(signal)
  );

  for (const row of rows ?? []) {
    const question = normalizeQuestionRow(row);
    if (question.discipline in grouped) grouped[question.discipline].push(question);
  }

  return grouped;
}

export async function upsertGeneratedQuestions(
  client: SupabaseClient<Database>,
  questions: CanonicalQuestion[]
): Promise<CanonicalQuestion[]> {
  const outcomes = await Promise.allSettled(
    questions.map(async ({ id: _id, ...question }) => {
      const data = await runQuery((signal) =>
        client
          .rpc('upsert_generated_question', { p_question: question as unknown as Json })
          .abortSignal(signal)
      ).catch(rethrowRpcError);
      if (!data) throw new QuizRepositoryError('database', 'A questão não foi persistida.');
      return normalizeQuestionRow(data);
    })
  );

  return outcomes.map((outcome) => {
    if (outcome.status === 'rejected') throw outcome.reason;
    return outcome.value;
  });
}

export async function getAttemptByRequestId(
  client: SupabaseClient<Database>,
  userId: string,
  requestId: string
): Promise<{ id: string; expiresAt: string; questions: CanonicalQuestion[] } | null> {
  const attempt = await runQuery((signal) => client
    .from('quiz_attempts')
    .select('id, expires_at')
    .eq('user_id', userId)
    .eq('request_id', requestId)
    .abortSignal(signal)
    .maybeSingle(), 'fast');

  if (!attempt) return null;

  const links = await runQuery((signal) => client
    .from('quiz_attempt_questions')
    .select('position, generated_questions(*)')
    .eq('attempt_id', attempt.id)
    .order('position', { ascending: true })
    .abortSignal(signal), 'fast');

  const questions = (links ?? []).map((link) => {
    const row = link.generated_questions;
    if (!row || Array.isArray(row)) {
      throw new QuizRepositoryError('database', 'A tentativa contém uma referência inválida.');
    }
    return normalizeQuestionRow(row);
  });

  return { id: attempt.id, expiresAt: attempt.expires_at, questions };
}

export async function createQuizAttempt(
  client: SupabaseClient<Database>,
  input: { userId: string; requestId: string; questions: CanonicalQuestion[] }
) {
  const data = await runQuery((signal) => client
    .rpc('create_quiz_attempt', {
      p_user_id: input.userId,
      p_request_id: input.requestId,
      p_question_ids: input.questions.map((question) => question.id),
    })
    .abortSignal(signal)
  ).catch(rethrowRpcError);
  if (!data) throw new QuizRepositoryError('database', 'A tentativa não foi criada.');
  return data;
}

export async function submitQuizAttempt(
  client: SupabaseClient<Database>,
  input: { attemptId: string; userId: string; selectedAnswers: Record<string, string> }
): Promise<QuizResult> {
  const data = await runQuery((signal) => client
    .rpc('submit_quiz_attempt', {
      p_attempt_id: input.attemptId,
      p_user_id: input.userId,
      p_selected_answers: input.selectedAnswers as Json,
    })
    .abortSignal(signal)
  ).catch(rethrowRpcError);
  if (!data) throw new QuizRepositoryError('database', 'O resultado não foi persistido.');
  try {
    return parseQuizResult(data);
  } catch (error) {
    if (error instanceof QuizResultMappingError) {
      throw new QuizRepositoryError('database', error.message);
    }
    throw error;
  }
}
