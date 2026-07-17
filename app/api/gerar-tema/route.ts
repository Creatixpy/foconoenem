import { NextRequest, NextResponse } from 'next/server';
import { extractJson } from '@/lib/ai/parse-json';
import { createAdminClient } from '@/lib/db/server';
import { getUserAiRuntime, type UserAiRuntime } from '@/lib/server/ai/provider';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { cleanupCachedThemesIfDue } from '@/lib/server/local-maintenance';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import {
  createCachedThemes,
  getCachedThemePool,
  getRecentUserEssayThemes,
  markCachedThemeAsUsed,
} from '@/lib/db/repositories/essays';

type ThemeData = {
  tema: string;
  textoApoio1: string;
  textoApoio2: string;
};

type CachedThemeCandidate = {
  id: string;
  tema: string;
  texto_apoio1: string;
  texto_apoio2: string;
  usado_count: number;
  created_at: string;
};

const THEME_BATCH_SIZE = 4;
const MIN_THEME_POOL = 8;

function normalizeThemeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function sanitizeTheme(theme: Partial<ThemeData>): ThemeData | null {
  const tema = theme.tema?.trim();
  const textoApoio1 = theme.textoApoio1?.trim();
  const textoApoio2 = theme.textoApoio2?.trim();

  if (!tema || !textoApoio1 || !textoApoio2) return null;
  if (tema.length < 10 || textoApoio1.length < 40 || textoApoio2.length < 40) return null;

  return { tema, textoApoio1, textoApoio2 };
}

function dedupeThemes(themes: ThemeData[]): ThemeData[] {
  const unique = new Map<string, ThemeData>();

  for (const theme of themes) {
    const key = normalizeThemeKey(theme.tema);
    if (!key || unique.has(key)) continue;
    unique.set(key, theme);
  }

  return [...unique.values()];
}

async function requestThemesBatch(
  runtime: UserAiRuntime,
  excludedThemes: string[]
): Promise<{ themes: ThemeData[]; provider: string; tier: 'standard' | 'max' }> {
  const exclusionBlock = excludedThemes.length > 0
    ? `Evite gerar temas iguais ou muito próximos destes exemplos já usados:\n${excludedThemes.map((theme) => `- ${theme}`).join('\n')}`
    : 'Gere temas realmente variados entre si.';

  const response = await runtime.complete({
    label: 'generateThemeBatch',
    messages: [
      {
        role: 'user',
        content: `
          Gere ${THEME_BATCH_SIZE} temas INÉDITOS e bem diferentes entre si para redação estilo ENEM, cada um acompanhado de dois textos de apoio curtos, informativos e neutros.

          Regras obrigatórias:
          - Os temas devem cobrir recortes sociais diferentes. Não concentre tudo em inteligência artificial, educação ou tecnologia.
          - Os textos de apoio devem trazer repertório, contexto social e conflito real, sem repetir a mesma ideia com outras palavras.
          - Evite temas genéricos demais e evite títulos quase idênticos.
          - O texto de apoio deve ser útil para argumentação de um estudante.
          - Responda APENAS em JSON.

          ${exclusionBlock}

          Formato:
          {
            "themes": [
              {
                "tema": "Título do tema",
                "textoApoio1": "Texto de apoio principal",
                "textoApoio2": "Segundo texto de apoio"
              }
            ]
          }
        `,
      },
    ],
    temperature: 0.9,
    maxTokens: 3000,
    topP: 1,
    expectJson: true,
  });

  const parsed = extractJson<{ themes?: Partial<ThemeData>[]; data?: Partial<ThemeData>[] }>(response.content);
  const rawThemes = Array.isArray(parsed.themes)
    ? parsed.themes
    : Array.isArray(parsed.data)
      ? parsed.data
      : [];

  const normalized = dedupeThemes(
    rawThemes
      .map((theme) => sanitizeTheme(theme))
      .filter((theme): theme is ThemeData => Boolean(theme))
  );

  if (normalized.length === 0) {
    throw new Error('A IA não retornou temas válidos.');
  }

  return {
    themes: normalized,
    provider: response.provider,
    tier: response.tier,
  };
}

function pickThemeCandidate(
  pool: CachedThemeCandidate[],
  recentUserThemeKeys: Set<string>
) {
  const uniqueByTheme = new Map<string, CachedThemeCandidate>();

  for (const item of pool) {
    const key = normalizeThemeKey(item.tema);
    if (!key || recentUserThemeKeys.has(key)) continue;

    const current = uniqueByTheme.get(key);
    if (
      !current ||
      item.usado_count < current.usado_count ||
      (item.usado_count === current.usado_count &&
        new Date(item.created_at).getTime() > new Date(current.created_at).getTime())
    ) {
      uniqueByTheme.set(key, item);
    }
  }

  const candidates = [...uniqueByTheme.values()].sort((a, b) => {
    const usageDelta = a.usado_count - b.usado_count;
    if (usageDelta !== 0) return usageDelta;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  if (candidates.length === 0) return null;

  const shortlist = candidates.slice(0, Math.min(4, candidates.length));
  return shortlist[Math.floor(Math.random() * shortlist.length)];
}

export async function GET(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  await cleanupCachedThemesIfDue();

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  const rateIdentifier = auth.userId || ip;
  const rateResult = await checkRateLimit(rateIdentifier, '/api/gerar-tema', 3, 1);
  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        error: 'Muitas requisições',
        message: `Você atingiu o limite de requisições. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
        resetAt: rateResult.resetAt.toISOString(),
      },
      { status: 429 }
    );
  }

  const operatingInfo = await getOperatingHoursInfo();
  if (!operatingInfo.isOpen) {
    return NextResponse.json(
      {
        error: 'Sistema fora do horário de funcionamento',
        message: operatingInfo.message,
        horarioFuncionamento: `${operatingInfo.opensAt} - ${operatingInfo.closesAt}`,
      },
      { status: 403 }
    );
  }

  const recentThemes = await getRecentUserEssayThemes(adminClient, auth.userId, 10).catch(() => []);
  const recentThemeKeys = new Set(recentThemes.map((theme) => normalizeThemeKey(theme)));
  const aiRuntime = await getUserAiRuntime(auth.userId);

  if (aiRuntime.subscription.hasMaxAccess) {
    try {
      const generated = await requestThemesBatch(aiRuntime, recentThemes.slice(0, 25));
      const selectedTheme =
        generated.themes[Math.floor(Math.random() * generated.themes.length)] ?? generated.themes[0];

      await trackEvent({
        eventType: 'theme_generated',
        metadata: {
          tema: selectedTheme.tema,
          generated_batch_size: generated.themes.length,
          provider: generated.provider,
          subscription_plan: aiRuntime.subscription.planCode,
          ai_tier: generated.tier,
        },
        userIp: ip,
        userAgent,
        userId: auth.userId,
      });

      return NextResponse.json({
        tema: selectedTheme.tema,
        textoApoio1: selectedTheme.textoApoio1,
        textoApoio2: selectedTheme.textoApoio2,
        cached: false,
        plan: aiRuntime.subscription.planCode,
      });
    } catch (error) {
      console.error('Erro ao gerar tema Max com IA:', error);
      return NextResponse.json(
        {
          error: 'Erro ao gerar tema',
          message: 'Não foi possível gerar um tema Max agora. Tente novamente em instantes.',
        },
        { status: 503 }
      );
    }
  }

  let pool = await getCachedThemePool(adminClient, { daysBack: 90, limit: 60 }).catch(() => []);
  let candidate = pickThemeCandidate(pool, recentThemeKeys);
  let generatedThemes: ThemeData[] = [];
  let providerUsed: string | null = null;

  const availableUniqueThemes = new Set(
    pool
      .map((item) => normalizeThemeKey(item.tema))
      .filter((item) => item && !recentThemeKeys.has(item))
  ).size;

  if (!candidate || availableUniqueThemes < MIN_THEME_POOL) {
    const excludedThemes = dedupeThemes(
      pool.map((item) => ({
        tema: item.tema,
        textoApoio1: item.texto_apoio1,
        textoApoio2: item.texto_apoio2,
      }))
    )
      .map((item) => item.tema)
      .slice(0, 20);

    try {
      const generated = await requestThemesBatch(aiRuntime, [...recentThemes, ...excludedThemes].slice(0, 25));
      generatedThemes = generated.themes;
      providerUsed = generated.provider;
      await createCachedThemes(adminClient, generatedThemes);
      pool = await getCachedThemePool(adminClient, { daysBack: 90, limit: 80 }).catch(() => pool);
      candidate = pickThemeCandidate(pool, recentThemeKeys);
    } catch (error) {
      console.error('Erro ao gerar lote de temas com IA:', error);
      if (!candidate) {
        return NextResponse.json(
          {
            error: 'Erro ao gerar tema',
            message: 'Nossa IA não respondeu a tempo. Tente novamente em instantes.',
          },
          { status: 503 }
        );
      }
    }
  }

  if (!candidate) {
    return NextResponse.json(
      {
        error: 'Nenhum tema disponível',
        message: 'Não foi possível preparar um tema válido agora. Tente novamente em instantes.',
      },
      { status: 503 }
    );
  }

  try {
    await markCachedThemeAsUsed(adminClient, candidate.id, candidate.usado_count);
  } catch (error) {
    console.error('Erro ao atualizar uso do tema:', error);
  }

  await trackEvent({
    eventType: generatedThemes.length > 0 ? 'theme_generated' : 'theme_cached',
    metadata: {
      tema: candidate.tema,
      generated_batch_size: generatedThemes.length,
      pool_size: pool.length,
      provider: providerUsed ?? undefined,
      subscription_plan: aiRuntime.subscription.planCode,
    },
    userIp: ip,
    userAgent,
    userId: auth.userId,
  });

  return NextResponse.json({
    tema: candidate.tema,
    textoApoio1: candidate.texto_apoio1,
    textoApoio2: candidate.texto_apoio2,
    cached: generatedThemes.length === 0,
    plan: aiRuntime.subscription.planCode,
  });
}
