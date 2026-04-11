import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { randomUUID } from 'crypto';
import type { GroqProvider } from '@/lib/ai/groq';
import { withGroqRetry } from '@/lib/ai/retry';
import { extractJson } from '@/lib/ai/parse-json';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUser } from '@/lib/server/auth-request';
import { z } from 'zod';
import { handleApiError, sanitizeString } from '@/lib/security';
import { getEssayById, createEssayResult, type NormalizedEssayResult } from '@/lib/db/repositories/essays';

const submissionSchema = z.object({
  redacao: z.string().min(50, 'A redação deve ter no mínimo 50 caracteres').max(5000, 'A redação não pode exceder 5000 caracteres'),
  usarTemaPadrao: z.boolean().optional(),
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

const DEFAULT_THEME = 'Os desafios da educação digital no Brasil contemporâneo';
const DEFAULT_TEXT_1 =
  'Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, e em famílias de baixa renda, o acesso é significativamente menor.';
const DEFAULT_TEXT_2 =
  'A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.';

async function requestEssayAnalysis(
  provider: GroqProvider,
  input: {
    submission: EssaySubmission;
    temaFinal: string;
    textoApoio1Final: string;
    textoApoio2Final: string;
    essayId: string;
  }
): Promise<Omit<NormalizedEssayResult, 'createdAt' | 'origem'>> {
  const { submission, temaFinal, textoApoio1Final, textoApoio2Final, essayId } = input;

  let prompt = `
    Você é um corretor especialista em redações do ENEM. Analise a seguinte redação sobre o tema "${temaFinal}" seguindo os 5 critérios de avaliação do ENEM:

    Competência 1: Domínio da norma padrão da língua escrita (0-200 pontos)
    Competência 2: Compreensão da proposta e aplicação de conceitos de várias áreas do conhecimento (0-200 pontos)
    Competência 3: Capacidade de selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista (0-200 pontos)
    Competência 4: Conhecimento dos mecanismos linguísticos para construção da argumentação (0-200 pontos)
    Competência 5: Elaboração de proposta de intervenção para o problema, respeitando os direitos humanos (0-200 pontos)
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

    Você deve responder APENAS com um objeto JSON válido, sem texto antes ou depois, com os seguintes campos, sem usar markdown:
    {
      "nota": número de 0 a 1000,
      "competencia1": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 1"
      },
      "competencia2": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 2"
      },
      "competencia3": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 3"
      },
      "competencia4": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 4"
      },
      "competencia5": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 5"
      },
      "feedbackGeral": "feedback geral sobre a redação",
      "pontoFortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
      "pontosAMelhorar": ["ponto a melhorar 1", "ponto a melhorar 2", "ponto a melhorar 3"]
    }
    
    LEMBRE-SE: Sua resposta deve ser apenas o objeto JSON, sem qualquer outro texto.
  `;

  const response = await provider.client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: provider.model,
    temperature: 0.1,
    max_completion_tokens: 15000,
    top_p: 1,
    stream: false,
    response_format: { type: 'json_object' },
  });

  const aiContent = response.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson<Partial<NormalizedEssayResult>>(aiContent);

  if (typeof parsed.nota !== 'number' || !parsed.feedbackGeral) {
    throw new Error('A resposta da IA está incompleta.');
  }

  const defaultCompetence: EssayCompetence = { nota: 0, comentario: 'Não foi possível avaliar' };

  return {
    id: essayId,
    nota: parsed.nota,
    competencia1: parsed.competencia1 ?? defaultCompetence,
    competencia2: parsed.competencia2 ?? defaultCompetence,
    competencia3: parsed.competencia3 ?? defaultCompetence,
    competencia4: parsed.competencia4 ?? defaultCompetence,
    competencia5: parsed.competencia5 ?? defaultCompetence,
    feedbackGeral: parsed.feedbackGeral ?? 'Não foi possível gerar feedback',
    pontoFortes: parsed.pontoFortes ?? [],
    pontosAMelhorar: parsed.pontosAMelhorar ?? [],
    redacaoOriginal: submission.redacao,
    tema: temaFinal,
    textoApoio1: textoApoio1Final,
    textoApoio2: textoApoio2Final,
  };
}

async function requestThemeAlignment(
  provider: GroqProvider,
  submission: EssaySubmission,
  temaFinal: string
): Promise<ThemeAlignmentResult> {
  const response = await provider.client.chat.completions.create({
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
    model: provider.model,
    temperature: 0,
    max_completion_tokens: 256,
    top_p: 1,
    stream: false,
    response_format: { type: 'json_object' },
  });

  const raw = response.choices?.[0]?.message?.content ?? '';
  const parsed = extractJson<{ alinhado?: boolean; justificativa?: string }>(raw);

  if (typeof parsed.alinhado !== 'boolean') {
    throw new Error('A verificação de tema não retornou o campo "alinhado".');
  }

  return {
    aligned: parsed.alinhado,
    justification: parsed.justificativa?.trim() || (parsed.alinhado ? 'Alinhado ao tema.' : 'Não aborda o tema proposto.'),
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await resolveRequestUser(request);
    if ('error' in auth) {
      return auth.error;
    }

    const supabase = auth.supabase as SupabaseClient<Database>;
    const userId = auth.userId;
    const id = request.nextUrl.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
       return NextResponse.json({ error: 'Formato de ID inválido' }, { status: 400 });
    }

    const result = await getEssayById(supabase, id, userId);
    if (!result) {
      return NextResponse.json({ error: 'Resultado não encontrado' }, { status: 404 });
    }

    await trackEvent({
      eventType: 'essay_viewed',
      metadata: { essay_id: id },
      userIp: request.headers.get('x-forwarded-for') ?? undefined,
      userAgent: request.headers.get('user-agent') ?? undefined,
      userId,
    });

    return NextResponse.json({ result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await resolveRequestUser(request);
    if ('error' in auth) {
      return auth.error;
    }

    const supabase = auth.supabase as SupabaseClient<Database>;
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

    const trimmedEssay = submission.redacao;
    const essayLength = trimmedEssay.length;

    if (submission.usarTemaPadrao === false && (!submission.tema || submission.tema.trim().length < 5)) {
      return NextResponse.json(
        { error: 'É necessário fornecer um tema personalizado válido' },
        { status: 400 }
      );
    }

    const essayId = randomUUID();
    const temaFinal = submission.usarTemaPadrao !== false ? DEFAULT_THEME : submission.tema ?? DEFAULT_THEME;
    const textoApoio1Final = submission.usarTemaPadrao !== false ? DEFAULT_TEXT_1 : submission.textoApoio1 ?? '';
    const textoApoio2Final = submission.usarTemaPadrao !== false ? DEFAULT_TEXT_2 : submission.textoApoio2 ?? '';

    let alignmentResult: ThemeAlignmentResult | null = null;
    try {
      const { result } = await withGroqRetry('verifyThemeAlignment', (provider) =>
        requestThemeAlignment(provider, { ...submission, redacao: trimmedEssay }, temaFinal)
      );
      alignmentResult = result;
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const attempts =
        error && typeof error === 'object' && 'attemptsLog' in error
          ? ((error as { attemptsLog?: string[] }).attemptsLog ?? undefined)
          : undefined;

      console.error('Erro ao validar alinhamento de tema:', error);
      return NextResponse.json(
        {
          error: 'Erro ao validar o tema',
          message: 'Não foi possível confirmar se a redação aborda o tema. Tente novamente em instantes.',
          diagnostics: undefined,
        },
        { status: 503 }
      );
    }

    if (!alignmentResult.aligned) {
      await trackEvent({
        eventType: 'error_occurred',
        metadata: {
          error_type: 'essay_rejected_theme',
          theme_type: submission.usarTemaPadrao !== false ? 'padrao' : submission.tema ? 'personalizado' : 'gerado',
          justification: alignmentResult.justification,
          tema: temaFinal,
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

    let aiAnalysis: { result: Omit<NormalizedEssayResult, 'createdAt' | 'origem'>; provider: string } | null = null;
    try {
      aiAnalysis = await withGroqRetry('analyseEssay', (provider) =>
        requestEssayAnalysis(provider, {
          submission: { ...submission, redacao: trimmedEssay },
          temaFinal,
          textoApoio1Final,
          textoApoio2Final,
          essayId,
        })
      );
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const attempts =
        error && typeof error === 'object' && 'attemptsLog' in error
          ? ((error as { attemptsLog?: string[] }).attemptsLog ?? undefined)
          : undefined;

      console.error('Erro ao analisar redação com IA:', error);
      return NextResponse.json(
        {
          error: 'Erro ao gerar correção',
          message: 'Nossa IA demorou mais do que o esperado. Tente novamente em instantes.',
          diagnostics: undefined,
        },
        { status: 503 }
      );
    }

    const result: NormalizedEssayResult = {
      ...aiAnalysis.result,
      id: essayId,
      redacaoOriginal: trimmedEssay,
      createdAt: new Date().toISOString(),
      origem: 'IA',
    };

    try {
      await createEssayResult(supabase, result, userId);
    } catch (error) {
      console.error('Erro ao salvar correção de redação:', error);
      return NextResponse.json(
        { error: 'Erro ao salvar o resultado desta redação.' },
        { status: 500 }
      );
    }

    await trackEvent({
      eventType: 'essay_submitted',
      metadata: {
        theme_type: submission.usarTemaPadrao !== false ? 'padrao' : submission.tema ? 'personalizado' : 'gerado',
        essay_length: essayLength,
        score: result.nota,
        tema: temaFinal,
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
