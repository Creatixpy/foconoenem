import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  toPublicQuestion,
  type CanonicalQuestion,
  type Discipline,
} from '@/lib/contracts/quiz';
import {
  createQuizAttempt,
  getAttemptByRequestId,
  getBalancedQuestions,
  getQuestionSignature,
  upsertGeneratedQuestions,
} from '@/lib/db/repositories/quizzes';
import type { Database } from '@/types/supabase';
import type { UserAiRuntime } from '@/lib/server/ai/provider';
import { generateQuestionsForDiscipline, mapWithConcurrency } from './generator';

const QUESTIONS_PER_DISCIPLINE = 3;

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

export async function prepareQuiz(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  input: { userId: string; requestId: string; disciplines: Discipline[] }
) {
  const existing = await getAttemptByRequestId(client, input.userId, input.requestId);
  if (existing) {
    return {
      attemptId: existing.id,
      expiresAt: existing.expiresAt,
      questions: existing.questions.map(toPublicQuestion),
    };
  }

  const stored = await getBalancedQuestions(client, input.disciplines);
  const selectedSignatures = new Set<string>();

  const selections = await mapWithConcurrency(input.disciplines, 2, async (discipline) => {
    const available = shuffle(stored[discipline] ?? []);
    const selected: CanonicalQuestion[] = [];

    if (!runtime.subscription.hasMaxAccess) {
      for (const question of available) {
        const signature = getQuestionSignature(question);
        if (selectedSignatures.has(signature)) continue;
        selectedSignatures.add(signature);
        selected.push(question);
        if (selected.length === QUESTIONS_PER_DISCIPLINE) break;
      }
    }

    const missing = QUESTIONS_PER_DISCIPLINE - selected.length;
    if (missing > 0) {
      const generated = await generateQuestionsForDiscipline(runtime, {
        discipline,
        count: missing,
        excludedTexts: available.map((question) => question.text),
      });
      const canonical = await upsertGeneratedQuestions(client, generated.questions);

      for (const question of canonical) {
        const signature = getQuestionSignature(question);
        if (selectedSignatures.has(signature)) continue;
        selectedSignatures.add(signature);
        selected.push(question);
        if (selected.length === QUESTIONS_PER_DISCIPLINE) break;
      }
    }

    if (selected.length !== QUESTIONS_PER_DISCIPLINE) {
      throw new Error(`Não foi possível preparar ${QUESTIONS_PER_DISCIPLINE} questões de ${discipline}.`);
    }
    return selected;
  });

  const questions = shuffle(selections.flat());
  const attempt = await createQuizAttempt(client, {
    userId: input.userId,
    requestId: input.requestId,
    questions,
  });

  return {
    attemptId: attempt.id,
    expiresAt: attempt.expires_at,
    questions: questions.map(toPublicQuestion),
  };
}
