import { NextRequest, NextResponse } from 'next/server';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, GroqProvider, isRateLimitError } from '@/lib/ai/groq';
import { createAdminClient } from '@/lib/db';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';

type CachedThemeRow = {
  id: string;
  tema: string;
  texto_apoio1: string;
  texto_apoio2: string;
  usado_count: number | null;
  created_at: string;
};

async function getCachedTheme() {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('cached_themes')
    .select('*')
    .gte('created_at', oneDayAgo)
    .order('usado_count', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar tema em cache:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as CachedThemeRow;

  const { error: updateError } = await supabase
    .from('cached_themes')
    .update({ usado_count: (row.usado_count ?? 0) + 1 })
    .eq('id', row.id);

  if (updateError) {
    console.error('Erro ao atualizar contador do cache de temas:', updateError);
  }

  return row;
}

async function cacheTheme(tema: string, textoApoio1: string, textoApoio2: string) {
  const supabase = createAdminClient();
  if (!supabase) return;

  const { error } = await supabase.from('cached_themes').insert({
    tema,
    texto_apoio1: textoApoio1,
    texto_apoio2: textoApoio2,
    usado_count: 1,
  });

  if (error) {
    console.error('Erro ao armazenar tema em cache:', error);
  }
}

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

  let parsed: { tema?: string; textoApoio1?: string; textoApoio2?: string };
  try {
    parsed = JSON.parse(content);
  } catch (parseError) {
    console.error('Falha ao parsear JSON diretamente:', parseError);
    const jsonMatch =
      content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      content.match(/(\{[\s\S]*\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('Formato de resposta inválido da IA.');
    }

    parsed = JSON.parse(jsonMatch[1].trim());
  }

  if (!parsed.tema || !parsed.textoApoio1 || !parsed.textoApoio2) {
    throw new Error('Resposta da IA não contém todos os campos necessários.');
  }

  return {
    tema: parsed.tema,
    textoApoio1: parsed.textoApoio1,
    textoApoio2: parsed.textoApoio2,
  };
}

async function generateThemeWithGroq() {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const theme = await requestTheme(provider);
        return { ...theme, provider: provider.name };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
        attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
        console.error(`Erro ao gerar tema com ${provider.name} (tentativa ${attempt}):`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || 'Falha ao gerar tema com IA');
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
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

  const cached = await getCachedTheme();
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

  let generated:
    | {
        tema: string;
        textoApoio1: string;
        textoApoio2: string;
        provider: string;
      }
    | null = null;

  try {
    generated = await generateThemeWithGroq();
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

  await cacheTheme(generated.tema, generated.textoApoio1, generated.textoApoio2);
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
