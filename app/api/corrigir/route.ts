import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { randomUUID } from 'crypto';
import { extractJson } from '@/lib/ai/parse-json';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { cleanupCachedThemesIfDue } from '@/lib/server/local-maintenance';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';
import { getUserAiRuntime, type UserAiRuntime } from '@/lib/server/ai/provider';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { z } from 'zod';
import { handleApiError, sanitizeString } from '@/lib/security';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import {
  createCachedThemes,
  createEssayResult,
  findCachedThemeByTema,
  type NormalizedEssayResult,
} from '@/lib/db/repositories/essays';

const submissionSchema = z.object({
  redacao: z.string().min(50, 'A redação deve ter no mínimo 50 caracteres').max(5000, 'A redação não pode exceder 5000 caracteres'),
  usarTemaPadrao: z.boolean().optional(),
  themeMode: z.enum(['generated', 'manual']).optional(),
  tema: z.string().min(5).optional(),
  textoApoio1: z.string().optional(),
  textoApoio2: z.string().optional()
});

type EssaySubmission = z.infer<typeof submissionSchema>;

type EssayCompetence = {
  nota: number;
  comentario: string;
};

type ThemeAlignmentResult = {
  aligned: boolean;
  justification: string;
};

type SupportTexts = {
  textoApoio1: string;
  textoApoio2: string;
};

type ThemeContext = SupportTexts & {
  tema: string;
  themeType: 'padrao' | 'manual' | 'gerado';
  supportSource: 'default' | 'request' | 'cache' | 'generated';
  supportProvider?: string;
};

type RawEssayAnalysis = {
  competencia1?: Partial<EssayCompetence>;
  competencia2?: Partial<EssayCompetence>;
  competencia3?: Partial<EssayCompetence>;
  competencia4?: Partial<EssayCompetence>;
  competencia5?: Partial<EssayCompetence>;
  feedbackGeral?: string;
  pontoFortes?: unknown;
  pontosAMelhorar?: unknown;
};

const DEFAULT_THEME = 'Os desafios da educação digital no Brasil contemporâneo';
const DEFAULT_TEXT_1 =
  'Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, e em famílias de baixa renda, o acesso é significativamente menor.';
const DEFAULT_TEXT_2 =
  'A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.';
const ENEM_COMPETENCE_SCORES = [0, 40, 80, 120, 160, 200] as const;

function normalizeThemeKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function clampToEnemCompetenceScore(value: unknown): number {
  const numericValue =
    typeof value === 'number'
      ? value
      : typeof value === 'string'
        ? Number(value)
        : 0;

  if (!Number.isFinite(numericValue)) return 0;

  return ENEM_COMPETENCE_SCORES.reduce((closest, score) =>
    Math.abs(score - numericValue) < Math.abs(closest - numericValue) ? score : closest
  );
}

function normalizeEssayCompetence(
  raw: Partial<EssayCompetence> | undefined,
  fallbackComment: string
): EssayCompetence {
  return {
    nota: clampToEnemCompetenceScore(raw?.nota),
    comentario:
      typeof raw?.comentario === 'string' && raw.comentario.trim()
        ? raw.comentario.trim()
        : fallbackComment,
  };
}

function normalizeList(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;

  const unique = Array.from(
    new Set(
      value
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    )
  );

  return unique.length > 0 ? unique.slice(0, 4) : fallback;
}

async function requestSupportTexts(
  runtime: UserAiRuntime,
  tema: string
): Promise<{ data: SupportTexts; provider: string }> {
  const response = await runtime.complete({
    label: 'generateSupportTexts',
    messages: [
      {
        role: 'user',
        content: `
          Crie dois textos de apoio curtos, complementares e úteis para uma redação do ENEM sobre o tema "${tema}".

          Regras:
          - O primeiro texto deve trazer contexto social ou dado relevante.
          - O segundo texto deve explorar impacto, desafio ou consequência.
          - Os textos precisam ser objetivos, informativos, sem inventar fonte específica e sem copiar a mesma ideia.
          - Responda APENAS em JSON.

          Formato:
          {
            "textoApoio1": "Texto de apoio 1",
            "textoApoio2": "Texto de apoio 2"
          }
        `,
      },
    ],
    temperature: 0.4,
    maxTokens: 1200,
    topP: 1,
    expectJson: true,
  });

  const parsed = extractJson<Partial<SupportTexts>>(response.content);
  const textoApoio1 = parsed.textoApoio1?.trim();
  const textoApoio2 = parsed.textoApoio2?.trim();

  if (!textoApoio1 || !textoApoio2) {
    throw new Error('A IA não retornou textos de apoio válidos.');
  }

  return {
    data: { textoApoio1, textoApoio2 },
    provider: response.provider,
  };
}

async function requestEssayAnalysis(
  runtime: UserAiRuntime,
  input: {
    submission: EssaySubmission;
    temaFinal: string;
    textoApoio1Final: string;
    textoApoio2Final: string;
    essayId: string;
  }
): Promise<{ data: Omit<NormalizedEssayResult, 'createdAt' | 'origem'>; provider: string }> {
  const { submission, temaFinal, textoApoio1Final, textoApoio2Final, essayId } = input;

  let prompt = `
    Você é um corretor especialista em redações do ENEM. Analise a redação abaixo sobre o tema "${temaFinal}".

    Avalie rigorosamente as 5 competências do ENEM.
    Cada competência deve receber APENAS um destes valores: 0, 40, 80, 120, 160 ou 200.
    A nota total deve ser a soma das 5 competências.
    Justifique a nota de cada competência de forma específica, citando forças e falhas reais do texto.
    Seja exigente com repertório improdutivo, fuga parcial do tema, proposta de intervenção genérica e problemas graves de coesão.
  `;

  if (textoApoio1Final) {
    prompt += `\nTEXTO DE APOIO I:\n${textoApoio1Final}\n`;
  }
  if (textoApoio2Final) {
    prompt += `\nTEXTO DE APOIO II:\n${textoApoio2Final}\n`;
  }

  prompt += `
    REDAÇÃO DO ESTUDANTE:
    ${submission.redacao}

    Responda APENAS com JSON válido, sem markdown:
    {
      "competencia1": {
        "nota": 0|40|80|120|160|200,
        "comentario": "análise objetiva da competência 1"
      },
      "competencia2": {
        "nota": 0|40|80|120|160|200,
        "comentario": "análise objetiva da competência 2"
      },
      "competencia3": {
        "nota": 0|40|80|120|160|200,
        "comentario": "análise objetiva da competência 3"
      },
      "competencia4": {
        "nota": 0|40|80|120|160|200,
        "comentario": "análise objetiva da competência 4"
      },
      "competencia5": {
        "nota": 0|40|80|120|160|200,
        "comentario": "análise objetiva da competência 5"
      },
      "feedbackGeral": "síntese clara da redação, conectando tese, repertório e intervenção",
      "pontoFortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
      "pontosAMelhorar": ["melhoria 1", "melhoria 2", "melhoria 3"]
    }
  `;

  const response = await runtime.complete({
    label: 'analyseEssay',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    maxTokens: 5000,
    topP: 1,
    expectJson: true,
  });

  const parsed = extractJson<RawEssayAnalysis>(response.content);

  const competencia1 = normalizeEssayCompetence(parsed.competencia1, 'Não foi possível avaliar a competência 1 com precisão.');
  const competencia2 = normalizeEssayCompetence(parsed.competencia2, 'Não foi possível avaliar a competência 2 com precisão.');
  const competencia3 = normalizeEssayCompetence(parsed.competencia3, 'Não foi possível avaliar a competência 3 com precisão.');
  const competencia4 = normalizeEssayCompetence(parsed.competencia4, 'Não foi possível avaliar a competência 4 com precisão.');
  const competencia5 = normalizeEssayCompetence(parsed.competencia5, 'Não foi possível avaliar a competência 5 com precisão.');

  const notaTotal =
    competencia1.nota +
    competencia2.nota +
    competencia3.nota +
    competencia4.nota +
    competencia5.nota;

  return {
    data: {
      id: essayId,
      nota: notaTotal,
      competencia1,
      competencia2,
      competencia3,
      competencia4,
      competencia5,
      feedbackGeral:
        typeof parsed.feedbackGeral === 'string' && parsed.feedbackGeral.trim()
          ? parsed.feedbackGeral.trim()
          : 'A redação apresenta potencial, mas precisa de ajustes para ganhar precisão argumentativa e consistência nas competências do ENEM.',
      pontoFortes: normalizeList(parsed.pontoFortes, [
        'Há um posicionamento identificável ao longo do texto.',
        'O texto demonstra tentativa de organização argumentativa.',
        'Existe repertório inicial para sustentar a discussão.',
      ]),
      pontosAMelhorar: normalizeList(parsed.pontosAMelhorar, [
        'Aprofundar os argumentos com causas, consequências e exemplos mais específicos.',
        'Melhorar a progressão lógica entre os parágrafos.',
        'Tornar a proposta de intervenção mais detalhada e executável.',
      ]),
      redacaoOriginal: submission.redacao,
      tema: temaFinal,
      textoApoio1: textoApoio1Final,
      textoApoio2: textoApoio2Final,
    },
    provider: response.provider,
  };
}

async function requestThemeAlignment(
  runtime: UserAiRuntime,
  submission: EssaySubmission,
  temaFinal: string
): Promise<ThemeAlignmentResult> {
  const response = await runtime.complete({
    label: 'verifyThemeAlignment',
    messages: [
      {
        role: 'user',
        content: `Analise rapidamente se a redação a seguir aborda o tema proposto.

Tema: "${temaFinal}"

Redação:
${submission.redacao}

Responda APENAS como JSON no formato:
{
  "alinhado": true|false,
  "justificativa": "Explicação breve"
}

Regras:
- Se a redação não tratar diretamente do tema, use alinhado=false.
- Se tangenciar de forma muito superficial, considere false e explique.
- Se abordar corretamente, alinhado=true e justifique em uma frase.
`,
      },
    ],
    temperature: 0,
    maxTokens: 256,
    topP: 1,
    expectJson: true,
  });

  const parsed = extractJson<{ alinhado?: boolean; justificativa?: string }>(response.content);

  if (typeof parsed.alinhado !== 'boolean') {
    throw new Error('A verificação de tema não retornou o campo "alinhado".');
  }

  return {
    aligned: parsed.alinhado,
    justification: parsed.justificativa?.trim() || (parsed.alinhado ? 'Alinhado ao tema.' : 'Não aborda o tema proposto.'),
  };
}

async function resolveThemeContext(
  submission: EssaySubmission,
  aiRuntime: UserAiRuntime,
  supabase: SupabaseClient<Database>,
  adminClient: SupabaseClient<Database>
): Promise<ThemeContext> {
  const wantsDefaultTheme = submission.usarTemaPadrao === true;
  const providedTheme = submission.tema?.trim();
  const providedSupportTexts = {
    textoApoio1: submission.textoApoio1?.trim() || '',
    textoApoio2: submission.textoApoio2?.trim() || '',
  };

  if (wantsDefaultTheme) {
    return {
      tema: DEFAULT_THEME,
      textoApoio1: DEFAULT_TEXT_1,
      textoApoio2: DEFAULT_TEXT_2,
      themeType: 'padrao',
      supportSource: 'default',
    };
  }

  if (!providedTheme || normalizeThemeKey(providedTheme).length < 5) {
    throw new Error('É necessário fornecer um tema válido para corrigir a redação.');
  }

  if (providedSupportTexts.textoApoio1 && providedSupportTexts.textoApoio2) {
    await createCachedThemes(adminClient, [{
      tema: providedTheme,
      textoApoio1: providedSupportTexts.textoApoio1,
      textoApoio2: providedSupportTexts.textoApoio2,
    }]).catch((error) => {
      console.error('Erro ao armazenar tema enviado pelo cliente:', error);
    });

    return {
      tema: providedTheme,
      textoApoio1: providedSupportTexts.textoApoio1,
      textoApoio2: providedSupportTexts.textoApoio2,
      themeType: submission.themeMode === 'manual' ? 'manual' : 'gerado',
      supportSource: 'request',
    };
  }

  const canUseSharedCache = !aiRuntime.subscription.hasMaxAccess;
  const cachedTheme = canUseSharedCache
    ? await findCachedThemeByTema(supabase, providedTheme).catch(() => null)
    : null;
  if (cachedTheme?.texto_apoio1?.trim() && cachedTheme.texto_apoio2?.trim()) {
    return {
      tema: cachedTheme.tema,
      textoApoio1: cachedTheme.texto_apoio1.trim(),
      textoApoio2: cachedTheme.texto_apoio2.trim(),
      themeType: submission.themeMode === 'manual' ? 'manual' : 'gerado',
      supportSource: 'cache',
    };
  }

  const generatedSupport = await requestSupportTexts(aiRuntime, providedTheme);

  if (canUseSharedCache) {
    await createCachedThemes(adminClient, [{
      tema: providedTheme,
      textoApoio1: generatedSupport.data.textoApoio1,
      textoApoio2: generatedSupport.data.textoApoio2,
    }]).catch((error) => {
      console.error('Erro ao salvar novos textos de apoio:', error);
    });
  }

  return {
    tema: providedTheme,
    textoApoio1: generatedSupport.data.textoApoio1,
    textoApoio2: generatedSupport.data.textoApoio2,
    themeType: submission.themeMode === 'manual' ? 'manual' : 'gerado',
    supportSource: 'generated',
    supportProvider: generatedSupport.provider,
  };
}

export async function POST(request: NextRequest) {
  try {
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

    const userId = auth.userId;
    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const userAgent = request.headers.get('user-agent') ?? 'unknown';

    const rateIdentifier = userId || ip;
    const rateResult = await checkRateLimit(rateIdentifier, '/api/corrigir', 5, 1);
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

    let submission: EssaySubmission;
    try {
      const json = await request.json();
      submission = submissionSchema.parse(json);
    } catch (e) {
      if (e instanceof z.ZodError) throw e;
      return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
    }

    submission.redacao = sanitizeString(submission.redacao);
    if (submission.tema) submission.tema = sanitizeString(submission.tema);
    if (submission.textoApoio1) submission.textoApoio1 = sanitizeString(submission.textoApoio1);
    if (submission.textoApoio2) submission.textoApoio2 = sanitizeString(submission.textoApoio2);

    const trimmedEssay = submission.redacao;
    const essayLength = trimmedEssay.length;
    const essayId = randomUUID();
    const aiRuntime = await getUserAiRuntime(userId);

    let themeContext: ThemeContext;
    try {
      themeContext = await resolveThemeContext(submission, aiRuntime, adminClient, adminClient);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível preparar o tema da redação.';
      if (message.includes('tema válido')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }

      console.error('Erro ao resolver tema/textos de apoio:', error);
      return NextResponse.json(
        {
          error: 'Erro ao preparar tema e textos de apoio',
          message: 'Não foi possível preparar o material de apoio da redação. Tente novamente em instantes.',
        },
        { status: 503 }
      );
    }

    let alignmentResult: ThemeAlignmentResult;
    try {
      alignmentResult = await requestThemeAlignment(
        aiRuntime,
        { ...submission, redacao: trimmedEssay },
        themeContext.tema
      );
    } catch (error) {
      console.error('Erro ao validar alinhamento de tema:', error);
      return NextResponse.json(
        {
          error: 'Erro ao validar o tema',
          message: 'Não foi possível confirmar se a redação aborda o tema. Tente novamente em instantes.',
        },
        { status: 503 }
      );
    }

    if (!alignmentResult.aligned) {
      await trackEvent({
        eventType: 'error_occurred',
        metadata: {
          error_type: 'essay_rejected_theme',
          theme_type: themeContext.themeType,
          justification: alignmentResult.justification,
          tema: themeContext.tema,
          subscription_plan: aiRuntime.subscription.planCode,
        },
        userIp: ip,
        userAgent,
        userId,
      });

      return NextResponse.json(
        {
          error: 'Tema não abordado',
          message: 'Sua redação não trata do tema solicitado. Revise antes de reenviar.',
          justification: alignmentResult.justification,
        },
        { status: 400 }
      );
    }

    let aiAnalysis: { data: Omit<NormalizedEssayResult, 'createdAt' | 'origem'>; provider: string };
    try {
      aiAnalysis = await requestEssayAnalysis(aiRuntime, {
        submission: { ...submission, redacao: trimmedEssay },
        temaFinal: themeContext.tema,
        textoApoio1Final: themeContext.textoApoio1,
        textoApoio2Final: themeContext.textoApoio2,
        essayId,
      });
    } catch (error) {
      console.error('Erro ao analisar redação com IA:', error);
      return NextResponse.json(
        {
          error: 'Erro ao gerar correção',
          message: 'Nossa IA demorou mais do que o esperado. Tente novamente em instantes.',
        },
        { status: 503 }
      );
    }

    const result: NormalizedEssayResult = {
      ...aiAnalysis.data,
      id: essayId,
      redacaoOriginal: trimmedEssay,
      createdAt: new Date().toISOString(),
      origem: 'IA',
    };

    try {
      await createEssayResult(adminClient, result, userId);
    } catch (error) {
      console.error('Erro ao salvar correção de redação:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar o resultado desta redação.' },
        { status: 500 }
      );
    }

    const { error: statsError } = await adminClient.rpc('recalculate_user_statistics', {
      target_user_id: userId,
    });
    if (statsError) {
      console.error('Erro ao recalcular estatísticas após redação:', statsError);
    }

    await trackEvent({
      eventType: 'essay_submitted',
      metadata: {
        theme_type: themeContext.themeType,
        support_source: themeContext.supportSource,
        support_provider: themeContext.supportProvider ?? undefined,
        subscription_plan: aiRuntime.subscription.planCode,
        essay_length: essayLength,
        score: result.nota,
        tema: themeContext.tema,
        provider: aiAnalysis.provider,
        alignment_justification: alignmentResult.justification,
      },
      userIp: ip,
      userAgent,
      userId,
    });

    return NextResponse.json({ id: essayId });
  } catch (error) {
    return handleApiError(error);
  }
}
