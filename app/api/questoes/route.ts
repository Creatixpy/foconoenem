import { NextRequest, NextResponse } from 'next/server';
import { createQuizSchema, submitQuizSchema } from '@/lib/contracts/quiz';
import {
  QuizRepositoryError,
  submitQuizAttempt,
} from '@/lib/db/repositories/quizzes';
import { createAdminClient } from '@/lib/db/server';
import { getUserAiRuntime } from '@/lib/server/ai/provider';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import {
  cleanupGeneratedQuestionsIfDue,
  cleanupQuizAttemptsIfDue,
} from '@/lib/server/local-maintenance';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { prepareQuiz } from '@/lib/server/quiz/service';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

function validationError(message: string) {
  return NextResponse.json({ error: 'invalid_request', message }, { status: 400 });
}

async function parseJson(request: NextRequest): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function verifyAvailability(userId: string) {
  const [operatingInfo, rateResult] = await Promise.all([
    getOperatingHoursInfo(),
    checkRateLimit(userId, '/api/questoes', 5, 1),
  ]);

  if (!operatingInfo.isOpen) {
    return NextResponse.json(
      {
        error: 'outside_operating_hours',
        message: operatingInfo.message,
        horarioFuncionamento: `${operatingInfo.opensAt} - ${operatingInfo.closesAt}`,
      },
      { status: 403 }
    );
  }

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'rate_limit_exceeded',
        message: 'Limite de simulados atingido. Tente novamente mais tarde.',
        resetAt: rateResult.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  return null;
}

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) return originError;

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) return auth.error;

  const parsed = createQuizSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? 'Payload inválido.');
  }

  const availabilityError = await verifyAvailability(auth.userId);
  if (availabilityError) return availabilityError;

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    await Promise.all([
      cleanupQuizAttemptsIfDue(),
      cleanupGeneratedQuestionsIfDue(),
    ]);
    const runtime = await getUserAiRuntime(auth.userId);
    const quiz = await prepareQuiz(adminClient, runtime, {
      userId: auth.userId,
      requestId: parsed.data.requestId,
      disciplines: [...new Set(parsed.data.disciplines)],
    });

    return NextResponse.json(quiz, { status: 201 });
  } catch (error) {
    console.error('Falha ao preparar simulado:', error);
    const status = error instanceof QuizRepositoryError && error.kind === 'conflict' ? 409 : 503;
    return NextResponse.json(
      {
        error: status === 409 ? 'request_conflict' : 'quiz_unavailable',
        message:
          status === 409
            ? 'Este identificador já foi usado com outro simulado.'
            : 'Não foi possível preparar o simulado agora. Tente novamente em instantes.',
      },
      { status }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) return originError;

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) return auth.error;

  const parsed = submitQuizSchema.safeParse(await parseJson(request));
  if (!parsed.success) {
    return validationError(parsed.error.issues[0]?.message ?? 'Payload inválido.');
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    const result = await submitQuizAttempt(adminClient, {
      attemptId: parsed.data.attemptId,
      userId: auth.userId,
      selectedAnswers: parsed.data.selectedAnswers,
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('Falha ao finalizar simulado:', error);
    if (error instanceof QuizRepositoryError) {
      const statusByKind = {
        not_found: 404,
        expired: 410,
        invalid: 400,
        conflict: 409,
        database: 503,
      } as const;
      return NextResponse.json(
        { error: `quiz_${error.kind}` },
        { status: statusByKind[error.kind] }
      );
    }
    return NextResponse.json({ error: 'quiz_unavailable' }, { status: 503 });
  }
}
