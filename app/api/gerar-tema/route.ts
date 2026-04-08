import { NextRequest, NextResponse } from 'next/server';
import type { GroqProvider } from '@/lib/ai/groq';
import { withGroqRetry } from '@/lib/ai/retry';
import { extractJson } from '@/lib/ai/parse-json';
import { createAdminClient } from '@/lib/db/server';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';
import { getLeastUsedCachedTheme, createCachedTheme } from '@/lib/db/repositories/essays';

async function requestTheme(provider: GroqProvider) {
  const response = await provider.client.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `
          Gere um tema inédito e atual para redação do ENEM, acompanhado de dois textos de apoio curtos.
          Responda APENAS como JSON:
          {
            "tema": "Título do tema",
            "textoApoio1": "Texto de apoio principal",
            "textoApoio2": "Segundo texto de apoio"
          }
        `,
      },
    ],
    model: provider.model,
    temperature: 0.4,
    max_completion_tokens: 1024,
    top_p: 1,
    stream: false,
    response_format: { type: 'json_object' },
  });

  const content = response.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson<{ tema?: string; textoApoio1?: string; textoApoio2?: string }>(content);

  if (!parsed.tema || !parsed.textoApoio1 || !parsed.textoApoio2) {
    throw new Error('Resposta da IA não contém todos os campos necessários.');
  }

  return {
    tema: parsed.tema,
    textoApoio1: parsed.textoApoio1,
    textoApoio2: parsed.textoApoio2,
  };
}

export async function GET(request: NextRequest) {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
  const userAgent = request.headers.get('user-agent') ?? 'unknown';

  const rateResult = await checkRateLimit(ip, '/api/gerar-tema', 3, 1);
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

  try {
    const cached = await getLeastUsedCachedTheme(supabase);
    if (cached) {
      await trackEvent({
        eventType: 'theme_cached',
        metadata: {
          tema: cached.tema,
          cache_age_hours: Math.floor((Date.now() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60)),
        },
        userIp: ip,
        userAgent,
      });

      return NextResponse.json({
        tema: cached.tema,
        textoApoio1: cached.texto_apoio1,
        textoApoio2: cached.texto_apoio2,
        cached: true,
      });
    }
  } catch (error) {
    console.error('Erro ao buscar tema em cache:', error);
  }

  let generated: { tema: string; textoApoio1: string; textoApoio2: string; provider: string } | null = null;

  try {
    const { result, provider } = await withGroqRetry('generateTheme', requestTheme);
    generated = { ...result, provider };
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    const attempts =
      error && typeof error === 'object' && 'attemptsLog' in error
        ? ((error as { attemptsLog?: string[] }).attemptsLog ?? undefined)
        : undefined;

    console.error('Erro ao gerar tema com IA:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar tema',
        message: 'Nossa IA não respondeu a tempo. Tente novamente em instantes.',
        diagnostics: { stage: 'generateThemeWithGroq', detail, attempts },
      },
      { status: 503 }
    );
  }

  try {
    await createCachedTheme(supabase, {
      tema: generated.tema,
      textoApoio1: generated.textoApoio1,
      textoApoio2: generated.textoApoio2,
    });
  } catch (error) {
    console.error('Erro ao armazenar tema em cache:', error);
  }

  await trackEvent({
    eventType: 'theme_generated',
    metadata: { tema: generated.tema, provider: generated.provider },
    userIp: ip,
    userAgent,
  });

  return NextResponse.json({
    ...generated,
    cached: false,
  });
}
