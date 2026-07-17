import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/db/server';
import { getUserAiRuntime } from '@/lib/server/ai/provider';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { trackEvent } from '@/lib/server/analytics';
import { createGeneratedTheme } from '@/lib/server/essay/service';
import { cleanupCachedThemesIfDue } from '@/lib/server/local-maintenance';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) return originError;

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) return auth.error;

  const [operatingInfo, rateResult] = await Promise.all([
    getOperatingHoursInfo(),
    checkRateLimit(auth.userId, '/api/gerar-tema', 3, 1),
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
    await cleanupCachedThemesIfDue();
    const runtime = await getUserAiRuntime(auth.userId);
    const generated = await createGeneratedTheme(adminClient, runtime, auth.userId);

    await trackEvent({
      eventType: 'theme_generated',
      metadata: {
        theme_id: generated.theme.id,
        private: runtime.subscription.hasMaxAccess,
        subscription_plan: runtime.subscription.planCode,
        provider: generated.provider,
      },
      userId: auth.userId,
    });

    return NextResponse.json({
      themeId: generated.theme.id,
      tema: generated.theme.tema,
      textoApoio1: generated.theme.textoApoio1,
      textoApoio2: generated.theme.textoApoio2,
    });
  } catch (error) {
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
