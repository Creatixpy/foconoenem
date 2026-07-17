import { generatedQuestionSchema, type QuizResult } from './quiz';

type PersistedQuizResult = {
  id: string;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  score: number;
  questions_data: unknown;
  answers_data: unknown;
};

export class QuizResultMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuizResultMappingError';
  }
}

export function parseQuizResult(row: PersistedQuizResult): QuizResult {
  if (!Array.isArray(row.questions_data) || !Array.isArray(row.answers_data)) {
    throw new QuizResultMappingError('O resultado persistido está incompleto.');
  }

  const answers = new Map<string, { selected: string | null; isCorrect: boolean }>();
  for (const raw of row.answers_data) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const answer = raw as Record<string, unknown>;
    if (typeof answer.question_id !== 'string') continue;
    answers.set(answer.question_id, {
      selected:
        typeof answer.selected_alternative_id === 'string'
          ? answer.selected_alternative_id
          : null,
      isCorrect: answer.is_correct === true,
    });
  }

  const questions = row.questions_data.map((raw) => {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
      throw new QuizResultMappingError('A revisão contém uma questão inválida.');
    }

    const candidate = raw as Record<string, unknown>;
    const parsed = generatedQuestionSchema.safeParse({
      discipline: candidate.discipline,
      text: candidate.text,
      alternatives: candidate.alternatives,
      explanation: candidate.explanation,
    });
    if (!parsed.success || !parsed.data.discipline || typeof candidate.id !== 'string') {
      throw new QuizResultMappingError('A revisão contém uma questão inválida.');
    }

    const answer = answers.get(candidate.id) ?? { selected: null, isCorrect: false };
    const correct = parsed.data.alternatives.find((alternative) => alternative.isCorrect);
    if (!correct) throw new QuizResultMappingError('A revisão não contém gabarito.');

    return {
      ...parsed.data,
      id: candidate.id,
      discipline: parsed.data.discipline,
      selectedAlternativeId: answer.selected,
      correctAlternativeId: correct.id,
      isCorrect: answer.isCorrect,
    };
  });

  return {
    id: row.id,
    totalQuestions: row.total_questions,
    correctAnswers: row.correct_answers,
    wrongAnswers: row.wrong_answers,
    unansweredQuestions: row.unanswered_questions,
    score: row.score,
    questions,
  };
}
