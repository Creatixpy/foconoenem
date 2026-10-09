import { ApiError, apiError } from '@/lib/client/api-errors';
import { quizAttemptResponseSchema, quizResultSchema, type Discipline } from '@/lib/contracts/quiz';
import type { QuizDraft } from '@/lib/contracts/student-drafts';

async function sendQuizRequest(
  method: 'POST' | 'PATCH',
  body: unknown,
  signal: AbortSignal,
  failureMessage: string
): Promise<unknown> {
  const response = await fetch('/api/questoes', {
    method,
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify(body),
  });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    if (method === 'PATCH' && (response.status === 404 || response.status === 410)) {
      throw new ApiError('Este simulado expirou ou não está mais disponível. Comece um novo simulado.', 'expired');
    }
    throw apiError(response, payload, failureMessage);
  }
  return payload;
}

export async function requestQuizAttempt(
  requestId: string,
  disciplines: Discipline[],
  signal: AbortSignal
) {
  const payload = await sendQuizRequest(
    'POST',
    { requestId, disciplines: [...disciplines].sort() },
    signal,
    'Não foi possível preparar o simulado. Tente novamente em instantes.'
  );
  const validated = quizAttemptResponseSchema.safeParse(payload);
  if (!validated.success) {
    throw new ApiError('Não conseguimos abrir o simulado. Tente novamente para recuperar a mesma tentativa.', 'unavailable');
  }
  return validated.data;
}

export async function requestQuizResult(
  submission: NonNullable<QuizDraft['submission']>,
  signal: AbortSignal
) {
  const payload = await sendQuizRequest(
    'PATCH',
    submission,
    signal,
    'Não foi possível confirmar o resultado. Suas respostas foram mantidas para tentar finalizar novamente.'
  );
  const validated = quizResultSchema.safeParse(
    payload && typeof payload === 'object' && 'result' in payload ? payload.result : null
  );
  if (!validated.success) {
    throw new ApiError('Não conseguimos abrir seu resultado. Tente finalizar novamente para recuperá-lo.', 'unavailable');
  }
  return validated.data;
}
