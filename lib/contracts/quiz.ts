import { z } from 'zod';

export const DISCIPLINES = [
  'Matemática',
  'Português',
  'Química',
  'Física',
  'Geografia',
] as const;

export const disciplineSchema = z.enum(DISCIPLINES);
export type Discipline = z.infer<typeof disciplineSchema>;

export const quizAlternativeSchema = z.strictObject({
  id: z.string().trim().min(1).max(16),
  text: z.string().trim().min(1).max(1_000),
  isCorrect: z.boolean(),
});

export const generatedQuestionSchema = z
  .strictObject({
    discipline: disciplineSchema.optional(),
    topic: z.string().trim().min(1).max(200).optional(),
    difficulty: z.string().trim().min(1).max(50).optional(),
    text: z.string().trim().min(20).max(8_000),
    alternatives: z.array(quizAlternativeSchema).length(4),
    explanation: z.string().trim().min(20).max(6_000),
  })
  .superRefine((question, context) => {
    const ids = new Set(question.alternatives.map((alternative) => alternative.id));
    const texts = new Set(
      question.alternatives.map((alternative) => normalizeText(alternative.text))
    );
    const correctCount = question.alternatives.filter(
      (alternative) => alternative.isCorrect
    ).length;

    if (ids.size !== 4) {
      context.addIssue({ code: 'custom', message: 'Os IDs das alternativas devem ser únicos.' });
    }
    if (texts.size !== 4) {
      context.addIssue({ code: 'custom', message: 'Os textos das alternativas devem ser únicos.' });
    }
    if (correctCount !== 1) {
      context.addIssue({ code: 'custom', message: 'A questão deve ter exatamente uma alternativa correta.' });
    }
  });

export const generatedQuestionsResponseSchema = z.strictObject({
  questions: z.array(generatedQuestionSchema).min(1),
});

export const createQuizSchema = z.strictObject({
  requestId: z.uuid(),
  disciplines: z.array(disciplineSchema).min(1).max(DISCIPLINES.length),
});

export const submitQuizSchema = z.strictObject({
  attemptId: z.uuid(),
  selectedAnswers: z.record(z.uuid(), z.string().trim().min(1).max(16)),
});

export type QuizAlternative = z.infer<typeof quizAlternativeSchema>;
export type CanonicalQuestion = Omit<z.infer<typeof generatedQuestionSchema>, 'discipline'> & {
  id: string;
  discipline: Discipline;
};

export const publicQuestionSchema = z.strictObject({
  id: z.uuid(),
  discipline: disciplineSchema,
  text: z.string().trim().min(20).max(8_000),
  alternatives: z.array(quizAlternativeSchema.omit({ isCorrect: true })).length(4),
});

export const quizQuestionReviewSchema = z.strictObject({
  id: z.uuid(),
  discipline: disciplineSchema,
  text: z.string().trim().min(20).max(8_000),
  alternatives: z.array(quizAlternativeSchema).length(4),
  explanation: z.string().trim().min(20).max(6_000),
  topic: z.string().trim().min(1).max(200).optional(),
  difficulty: z.string().trim().min(1).max(50).optional(),
  selectedAlternativeId: z.string().trim().min(1).max(16).nullable(),
  correctAlternativeId: z.string().trim().min(1).max(16),
  isCorrect: z.boolean(),
});

export const quizResultSchema = z.strictObject({
  id: z.uuid(),
  totalQuestions: z.number().int().positive(),
  correctAnswers: z.number().int().nonnegative(),
  wrongAnswers: z.number().int().nonnegative(),
  unansweredQuestions: z.number().int().nonnegative(),
  score: z.number().int().min(0).max(100),
  questions: z.array(quizQuestionReviewSchema).min(1),
});

export const quizAttemptResponseSchema = z.strictObject({
  attemptId: z.uuid(),
  expiresAt: z.iso.datetime({ offset: true }),
  questions: z.array(publicQuestionSchema).min(1).max(15),
});

export type PublicQuestion = z.infer<typeof publicQuestionSchema>;
export type QuizQuestionReview = z.infer<typeof quizQuestionReviewSchema>;
export type QuizResult = z.infer<typeof quizResultSchema>;

export function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function toPublicQuestion(question: CanonicalQuestion): PublicQuestion {
  return {
    id: question.id,
    discipline: question.discipline,
    text: question.text,
    alternatives: question.alternatives.map(({ id, text }) => ({ id, text })),
  };
}
