import { z } from 'zod';
import { generatedThemeResponseSchema } from './essay';
import { disciplineSchema, quizAttemptResponseSchema, submitQuizSchema } from './quiz';

export const essayDraftSchema = z.strictObject({
  themeMode: z.enum(['generated', 'manual']),
  theme: generatedThemeResponseSchema.nullable(),
  manualTheme: z.string().max(100_000),
  essay: z.string().max(1_000_000),
  submission: z.strictObject({ id: z.uuid(), inputKey: z.string().max(1_200_000) }).nullable(),
});
export type EssayDraft = z.infer<typeof essayDraftSchema>;
export const EMPTY_ESSAY_DRAFT: EssayDraft = {
  themeMode: 'generated', theme: null, manualTheme: '', essay: '', submission: null,
};

export const quizDraftSchema = z.strictObject({
  disciplines: z.array(disciplineSchema).max(5),
  requestId: z.uuid().nullable(),
  attempt: quizAttemptResponseSchema.nullable(),
  currentIndex: z.number().int().nonnegative(),
  selectedAnswers: submitQuizSchema.shape.selectedAnswers,
  submission: submitQuizSchema.nullable(),
  expired: z.boolean(),
}).superRefine((draft, context) => {
  const questions = draft.attempt?.questions ?? [];
  const validAnswers = (answers: Record<string, string>) => Object.entries(answers).every(
    ([id, answer]) => questions.some((question) => question.id === id && question.alternatives.some((option) => option.id === answer)),
  );
  if (draft.attempt && (!draft.requestId || draft.currentIndex >= questions.length)) {
    context.addIssue({ code: 'custom', message: 'Tentativa incompleta.' });
  }
  if (!validAnswers(draft.selectedAnswers) || (draft.submission && (
    draft.submission.attemptId !== draft.attempt?.attemptId || !validAnswers(draft.submission.selectedAnswers)
  ))) {
    context.addIssue({ code: 'custom', message: 'Respostas incompatíveis com a tentativa.' });
  }
});
export type QuizDraft = z.infer<typeof quizDraftSchema>;
export const EMPTY_QUIZ_DRAFT: QuizDraft = {
  disciplines: [], requestId: null, attempt: null, currentIndex: 0, selectedAnswers: {}, submission: null, expired: false,
};

export function freezeQuizSubmission(draft: QuizDraft): QuizDraft['submission'] {
  return draft.submission ?? (draft.attempt ? {
    attemptId: draft.attempt.attemptId,
    selectedAnswers: { ...draft.selectedAnswers },
  } : null);
}
