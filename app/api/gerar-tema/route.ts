import { after, NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { trackEvent } from '@/lib/server/analytics';
import { createGeneratedTheme } from '@/lib/server/essay/themes';
import { cleanupCachedThemesIfDue } from '@/lib/server/local-maintenance';
import { getStudyAiRuntime, StudyAccessError } from '@/lib/server/study-access';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export const runtime = 'nodejs';
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) return originError;

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) return auth.error;

  const rateResult = await checkRateLimit(auth.userId, '/api/gerar-tema', 3, 1);
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
    const [, aiRuntime] = await Promise.all([
      cleanupCachedThemesIfDue(),
      getStudyAiRuntime(auth.userId),
    ]);
    const generated = await createGeneratedTheme(adminClient, aiRuntime, auth.userId);

    after(() => trackEvent({
      eventType: 'theme_generated',
      metadata: {
        theme_id: generated.theme.id,
        private: aiRuntime.subscription.hasMaxAccess,
        subscription_plan: aiRuntime.subscription.planCode,
        provider: generated.provider,
      },
      userId: auth.userId,
    }));

    return NextResponse.json({
      themeId: generated.theme.id,
      tema: generated.theme.tema,
      textoApoio1: generated.theme.textoApoio1,
      textoApoio2: generated.theme.textoApoio2,
    });
  } catch (error) {
    if (error instanceof StudyAccessError) {
      return NextResponse.json(
        { error: 'outside_operating_hours', message: error.operatingInfo.message },
        { status: 403 }
      );
    }
    console.error('Falha ao gerar tema:', error);
    return NextResponse.json(
      {
        error: 'theme_unavailable',
        message: 'Não foi possível preparar um tema agora. Tente novamente em instantes.',
      },
      { status: 503 }
    );
  }
}
