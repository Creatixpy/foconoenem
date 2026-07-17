import { NextRequest, NextResponse } from 'next/server';
import { essaySubmissionSchema } from '@/lib/contracts/essay';
import { createAdminClient } from '@/lib/db/server';
import { getUserAiRuntime } from '@/lib/server/ai/provider';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { trackEvent } from '@/lib/server/analytics';
import { cleanupEssaySubmissionsIfDue } from '@/lib/server/local-maintenance';
import {
  correctEssay,
  EssayServiceError,
} from '@/lib/server/essay/service';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) return originError;

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) return auth.error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = essaySubmissionSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'invalid_request',
        message: parsed.error.issues[0]?.message ?? 'Payload inválido.',
      },
      { status: 400 }
    );
  }

  const [operatingInfo, rateResult] = await Promise.all([
    getOperatingHoursInfo(),
    checkRateLimit(auth.userId, '/api/corrigir', 5, 1),
  ]);
  if (!operatingInfo.isOpen) {
    return NextResponse.json(
      { error: 'outside_operating_hours', message: operatingInfo.message },
      { status: 403 }
    );
  }
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: 'rate_limit_exceeded', resetAt: rateResult.resetAt.toISOString() },
      { status: 429 }
    );
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json({ error: 'database_unavailable' }, { status: 503 });
  }

  try {
    await cleanupEssaySubmissionsIfDue();
    const runtime = await getUserAiRuntime(auth.userId);
    const outcome = await correctEssay(adminClient, runtime, {
      submissionId: parsed.data.submissionId,
      userId: auth.userId,
      essay: parsed.data.redacao.replace(/\0/g, ''),
      theme: parsed.data.theme,
    });

    if (outcome.state === 'off_topic') {
      return NextResponse.json(
        {
          error: 'off_topic',
          message: 'Sua redação não aborda diretamente o tema proposto.',
          justification: outcome.justification,
        },
        { status: 422 }
      );
    }
    if (outcome.state === 'conflict') {
      return NextResponse.json({ error: 'submission_conflict' }, { status: 409 });
    }
    if (outcome.state === 'in_progress') {
      return NextResponse.json(
        { error: 'submission_in_progress', retryable: true },
        { status: 409 }
      );
    }

    await trackEvent({
      eventType: 'essay_submitted',
      metadata: {
        submission_id: parsed.data.submissionId,
        theme_mode: parsed.data.theme.mode,
        theme_id: parsed.data.theme.mode === 'generated' ? parsed.data.theme.id : undefined,
        subscription_plan: runtime.subscription.planCode,
        essay_length: parsed.data.redacao.length,
        score: outcome.score,
        provider: outcome.provider,
      },
      userId: auth.userId,
    });

    return NextResponse.json({ id: outcome.resultId });
  } catch (error) {
    console.error('Falha ao corrigir redação:', error);
    if (error instanceof EssayServiceError && error.kind === 'theme_not_found') {
      return NextResponse.json({ error: 'theme_not_found' }, { status: 400 });
    }
    return NextResponse.json(
      {
        error: 'correction_unavailable',
        message: 'Não foi possível concluir a correção agora. Tente novamente em instantes.',
      },
      { status: 503 }
    );
  }
}
