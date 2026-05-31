/**
 * Quiz Repository
 * Database operations for quiz results and generated question reuse
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '@/types/supabase';
import type { Question } from '@/types';
import { withTimeout, DatabaseError } from '../client';
import type { GeneratedQuestionRow } from '../types';

type Discipline = Question['discipline'];
type StoredQuestion = Question & {
  createdAt: string;
  topic?: string | null;
  difficulty?: string | null;
};

type RecentQuestionExposure = {
  questionIds: Set<string>;
  questionSignatures: Set<string>;
  recentQuestionsByDiscipline: Partial<Record<Discipline, string[]>>;
};

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function isDiscipline(value: string): value is Discipline {
  return ['Matemática', 'Português', 'Química', 'Física', 'Geografia'].includes(value);
}

function normalizeAlternatives(alternatives: unknown): Question['alternatives'] | null {
  if (!Array.isArray(alternatives) || alternatives.length < 4) return null;

  const normalized = alternatives
    .map((alternative, index) => {
      if (!alternative || typeof alternative !== 'object') return null;

      const candidate = alternative as Record<string, unknown>;
      const text =
        typeof candidate.text === 'string'
          ? candidate.text.trim()
          : '';

      if (!text) return null;

      return {
        id:
          typeof candidate.id === 'string' && candidate.id.trim()
            ? candidate.id.trim()
            : String.fromCharCode(65 + index),
        text,
        isCorrect: Boolean(candidate.isCorrect),
      };
    })
    .filter((alternative): alternative is Question['alternatives'][number] => Boolean(alternative));

  if (normalized.length !== 4) return null;

  const uniqueTexts = new Set(normalized.map((alternative) => normalizeText(alternative.text)));
  const correctCount = normalized.filter((alternative) => alternative.isCorrect).length;

  if (uniqueTexts.size !== normalized.length || correctCount !== 1) {
    return null;
  }

  return normalized;
}

export function getQuestionSignature(
  question: Pick<Question, 'discipline' | 'text' | 'alternatives'>
): string {
  const alternativeSignature = [...question.alternatives]
    .map((alternative) => `${normalizeText(alternative.text)}:${alternative.isCorrect ? '1' : '0'}`)
    .sort()
    .join('|');

  return `${normalizeText(question.discipline)}::${normalizeText(question.text)}::${alternativeSignature}`;
}

function normalizeStoredQuestionRow(row: GeneratedQuestionRow): StoredQuestion | null {
  if (!isDiscipline(row.discipline) || !row.content?.trim()) return null;

  const alternatives = normalizeAlternatives(row.alternatives);
  if (!alternatives) return null;

  return {
    id: row.id,
    discipline: row.discipline,
    text: row.content.trim(),
    explanation: row.explanation?.trim() || 'Sem explicação disponível.',
    alternatives,
    topic: row.topic ?? null,
    difficulty: row.difficulty ?? null,
    createdAt: row.created_at ?? new Date(0).toISOString(),
  };
}

function normalizeQuestionHistoryEntry(entry: unknown): Question | null {
  if (!entry || typeof entry !== 'object') return null;

  const candidate = entry as Record<string, unknown>;
  if (!isDiscipline(String(candidate.discipline ?? '')) || typeof candidate.text !== 'string') {
    return null;
  }

  const alternatives = normalizeAlternatives(candidate.alternatives);
  if (!alternatives) return null;

  return {
    id: typeof candidate.id === 'string' ? candidate.id : '',
    discipline: candidate.discipline as Discipline,
    text: candidate.text.trim(),
    explanation:
      typeof candidate.explanation === 'string' && candidate.explanation.trim()
        ? candidate.explanation.trim()
        : 'Sem explicação disponível.',
    alternatives,
  };
}

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

export async function getStoredQuestionsForDisciplines(
  client: SupabaseClient<Database>,
  disciplines: Discipline[],
  options?: { limit?: number }
): Promise<Record<Discipline, StoredQuestion[]>> {
  const result = disciplines.reduce(
    (acc, discipline) => ({ ...acc, [discipline]: [] }),
    {} as Record<Discipline, StoredQuestion[]>
  );

  if (disciplines.length === 0) return result;

  const limit = options?.limit ?? 200;
  const rows = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('generated_questions')
      .select('*')
      .in('discipline', disciplines)
      .order('created_at', { ascending: false })
      .limit(limit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return (data ?? []) as GeneratedQuestionRow[];
  }, 'fast');

  const seenSignatures = new Set<string>();
  for (const row of rows) {
    const question = normalizeStoredQuestionRow(row);
    if (!question) continue;

    const signature = getQuestionSignature(question);
    if (seenSignatures.has(signature)) continue;
    seenSignatures.add(signature);
    result[question.discipline].push(question);
  }

  return result;
}

export async function getRecentUserQuestionExposure(
  client: SupabaseClient<Database>,
  userId: string,
  quizLimit = 10
): Promise<RecentQuestionExposure> {
  const rows = await withTimeout(async (signal) => {
    const { data, error } = await client
      .from('quiz_results')
      .select('questions_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(quizLimit)
      .abortSignal(signal);

    if (error) throw DatabaseError.fromPostgrestError(error);
    return data ?? [];
  }, 'fast');

  const exposure: RecentQuestionExposure = {
    questionIds: new Set<string>(),
    questionSignatures: new Set<string>(),
    recentQuestionsByDiscipline: {},
  };

  for (const row of rows) {
    if (!Array.isArray(row.questions_data)) continue;

    for (const rawQuestion of row.questions_data) {
      const question = normalizeQuestionHistoryEntry(rawQuestion);
      if (!question) continue;

      if (question.id) exposure.questionIds.add(question.id);
      exposure.questionSignatures.add(getQuestionSignature(question));

      const list = exposure.recentQuestionsByDiscipline[question.discipline] ?? [];
      if (list.length < 20) {
        list.push(question.text);
        exposure.recentQuestionsByDiscipline[question.discipline] = list;
      }
    }
  }

  return exposure;
}

export async function saveGeneratedQuestions(
  client: SupabaseClient<Database>,
  questions: Array<{
    id: string;
    discipline: string;
    text: string;
    alternatives: unknown;
    explanation: string;
    topic?: string | null;
    difficulty?: string | null;
  }>
): Promise<Question[]> {
  if (questions.length === 0) return [];

  const disciplines = Array.from(
    new Set(
      questions
        .map((question) => question.discipline)
        .filter((discipline): discipline is Discipline => isDiscipline(discipline))
    )
  );

  const existingBySignature = new Map<string, Question>();
  if (disciplines.length > 0) {
    const existing = await getStoredQuestionsForDisciplines(client, disciplines, { limit: 400 });
    for (const discipline of disciplines) {
      for (const question of existing[discipline]) {
        existingBySignature.set(getQuestionSignature(question), question);
      }
    }
  }

  const canonicalQuestions: Question[] = [];
  const insertRows: Array<Database['public']['Tables']['generated_questions']['Insert']> = [];

  for (const question of questions) {
    if (!isDiscipline(question.discipline) || !question.text.trim()) continue;

    const alternatives = normalizeAlternatives(question.alternatives);
    if (!alternatives) continue;

    const normalizedQuestion: Question = {
      id: question.id,
      discipline: question.discipline,
      text: question.text.trim(),
      explanation: question.explanation?.trim() || 'Sem explicação disponível.',
      alternatives,
    };

    const signature = getQuestionSignature(normalizedQuestion);
    const existing = existingBySignature.get(signature);
    if (existing) {
      canonicalQuestions.push(existing);
      continue;
    }

    existingBySignature.set(signature, normalizedQuestion);
    canonicalQuestions.push(normalizedQuestion);
    insertRows.push({
      id: normalizedQuestion.id,
      discipline: normalizedQuestion.discipline,
      content: normalizedQuestion.text,
      alternatives: normalizedQuestion.alternatives as unknown as Json,
      explanation: normalizedQuestion.explanation,
      topic: question.topic ?? null,
      difficulty: question.difficulty ?? null,
      created_at: new Date().toISOString(),
    });
  }

  if (insertRows.length > 0) {
    await withTimeout(async (signal) => {
      const { error } = await client
        .from('generated_questions')
        .insert(insertRows)
        .abortSignal(signal);

      if (error) throw DatabaseError.fromPostgrestError(error);
    });
  }

  return canonicalQuestions;
}
