import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { randomUUID } from 'crypto';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, GroqProvider, isRateLimitError } from '@/lib/ai/groq';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUser } from '@/lib/server/auth-request';

type EssaySubmission = {
  redacao: string;
  usarTemaPadrao?: boolean;
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
};

type EssayCompetence = {
  nota: number;
  comentario: string;
};

type EssayResult = {
  id: string;
  nota: number;
  competencia1: EssayCompetence;
  competencia2: EssayCompetence;
  competencia3: EssayCompetence;
  competencia4: EssayCompetence;
  competencia5: EssayCompetence;
  feedbackGeral: string;
  pontoFortes: string[];
  pontosAMelhorar: string[];
  redacaoOriginal: string;
  createdAt: string;
  origem: 'IA' | 'Simulação';
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
};

type EssayRow = Database['public']['Tables']['essay_results']['Row'];

type ThemeAlignmentResult = {
  aligned: boolean;
  justification: string;
};

const MAX_ESSAY_LENGTH = 5000;
const MIN_ESSAY_LENGTH = 50;

const DEFAULT_THEME = 'Os desafios da educação digital no Brasil contemporâneo';
const DEFAULT_TEXT_1 =
  'Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, e em famílias de baixa renda, o acesso é significativamente menor.';
const DEFAULT_TEXT_2 =
  'A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.';

function normalizeEssayRow(row: EssayRow): EssayResult {
  return {
    id: row.id,
    nota: row.nota,
    competencia1: row.competencia1 as EssayCompetence,
    competencia2: row.competencia2 as EssayCompetence,
    competencia3: row.competencia3 as EssayCompetence,
    competencia4: row.competencia4 as EssayCompetence,
    competencia5: row.competencia5 as EssayCompetence,
    feedbackGeral: row.feedback_geral,
    pontoFortes: (row.ponto_fortes as string[] | null) ?? [],
    pontosAMelhorar: (row.pontos_a_melhorar as string[] | null) ?? [],
    redacaoOriginal: row.redacao_original,
    createdAt: row.created_at,
    origem: row.origem as EssayResult['origem'],
    tema: row.tema ?? undefined,
    textoApoio1: row.texto_apoio1 ?? undefined,
    textoApoio2: row.texto_apoio2 ?? undefined,
  };
}

async function getResultById(client: SupabaseClient<Database>, id: string, userId: string): Promise<EssayResult | null> {
  const { data, error } = await client
    .from('essay_results')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar redação corrigida:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeEssayRow(data as EssayRow);
}

async function storeResult(
  client: SupabaseClient<Database>,
  result: EssayResult,
  userId: string
): Promise<void> {
  const payload: Database['public']['Tables']['essay_results']['Insert'] = {
    id: result.id,
    nota: result.nota,
    competencia1: result.competencia1,
    competencia2: result.competencia2,
    competencia3: result.competencia3,
    competencia4: result.competencia4,
    competencia5: result.competencia5,
    feedback_geral: result.feedbackGeral,
    ponto_fortes: result.pontoFortes,
    pontos_a_melhorar: result.pontosAMelhorar,
    redacao_original: result.redacaoOriginal,
    created_at: result.createdAt,
    origem: result.origem,
    tema: result.tema ?? null,
    texto_apoio1: result.textoApoio1 ?? null,
    texto_apoio2: result.textoApoio2 ?? null,
    user_id: userId,
  };

  const { error } = await client.from('essay_results').insert(payload);
  if (error) {
    throw error;
  }
}

async function requestEssayAnalysis(
  provider: GroqProvider,
  input: {
    submission: EssaySubmission;
    temaFinal: string;
    textoApoio1Final: string;
    textoApoio2Final: string;
    essayId: string;
  }
): Promise<Omit<EssayResult, 'createdAt' | 'origem'>> {
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

  let parsed: Partial<EssayResult>;
  try {
    parsed = JSON.parse(aiContent);
  } catch (parseError) {
    console.error('Falha ao parsear JSON diretamente:', parseError);
    const jsonMatch =
      aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      aiContent.match(/(\{[\s\S]*\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error('Formato de resposta inválido da API');
    }

    parsed = JSON.parse(jsonMatch[1].trim());
  }

  if (typeof parsed.nota !== 'number' || !parsed.feedbackGeral) {
    throw new Error('A resposta da IA está incompleta.');
  }

  return {
    id: essayId,
    nota: parsed.nota,
    competencia1: parsed.competencia1 ?? { nota: 0, comentario: 'Não foi possível avaliar' },
    competencia2: parsed.competencia2 ?? { nota: 0, comentario: 'Não foi possível avaliar' },
    competencia3: parsed.competencia3 ?? { nota: 0, comentario: 'Não foi possível avaliar' },
    competencia4: parsed.competencia4 ?? { nota: 0, comentario: 'Não foi possível avaliar' },
    competencia5: parsed.competencia5 ?? { nota: 0, comentario: 'Não foi possível avaliar' },
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
  let parsed: { alinhado?: boolean; justificativa?: string };
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    console.error('Falha ao interpretar verificação de alinhamento:', error, raw);
    throw new Error('Resposta inválida da IA ao verificar o tema.');
  }

  if (typeof parsed.alinhado !== 'boolean') {
    throw new Error('A verificação de tema não retornou o campo "alinhado".');
  }

  return {
    aligned: parsed.alinhado,
    justification: parsed.justificativa?.trim() || (parsed.alinhado ? 'Alinhado ao tema.' : 'Não aborda o tema proposto.'),
  };
}

async function verifyThemeAlignment(submission: EssaySubmission, temaFinal: string): Promise<ThemeAlignmentResult> {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        return await requestThemeAlignment(provider, submission, temaFinal);
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
        attemptsLog.push(`(tema:${provider.name}) tentativa ${attempt}: ${detail}`);
        console.error('Erro ao verificar alinhamento de tema:', error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || 'Falha ao verificar alinhamento de tema');
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
}

async function analyseEssay(input: {
  submission: EssaySubmission;
  temaFinal: string;
  textoApoio1Final: string;
  textoApoio2Final: string;
  essayId: string;
}): Promise<{ analysis: Omit<EssayResult, 'createdAt' | 'origem'>; provider: string }> {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const analysis = await requestEssayAnalysis(provider, input);
        return { analysis, provider: provider.name };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
        attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
        console.error(`Erro ao analisar redação com ${provider.name} (tentativa ${attempt}):`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || 'Falha ao analisar redação');
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
}

export async function GET(request: NextRequest) {
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

  const result = await getResultById(supabase, id, userId);
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
}

export async function POST(request: NextRequest) {
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
    submission = (await request.json()) as EssaySubmission;
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 });
  }

  if (!submission.redacao || typeof submission.redacao !== 'string') {
    return NextResponse.json({ error: 'Redação inválida' }, { status: 400 });
  }

  const trimmedEssay = submission.redacao.trim();
  const essayLength = trimmedEssay.length;

  if (essayLength < MIN_ESSAY_LENGTH) {
    return NextResponse.json(
      { error: `A redação deve ter no mínimo ${MIN_ESSAY_LENGTH} caracteres` },
      { status: 400 }
    );
  }

  if (essayLength > MAX_ESSAY_LENGTH) {
    return NextResponse.json(
      { error: `A redação não pode exceder ${MAX_ESSAY_LENGTH} caracteres` },
      { status: 400 }
    );
  }

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
    alignmentResult = await verifyThemeAlignment({ ...submission, redacao: trimmedEssay }, temaFinal);
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
        diagnostics: { stage: 'verifyThemeAlignment', detail, attempts },
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

  let aiAnalysis: { analysis: Omit<EssayResult, 'createdAt' | 'origem'>; provider: string } | null = null;
  try {
    aiAnalysis = await analyseEssay({
      submission: { ...submission, redacao: trimmedEssay },
      temaFinal,
      textoApoio1Final,
      textoApoio2Final,
      essayId,
    });
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
        diagnostics: { stage: 'analyseEssay', detail, attempts },
      },
      { status: 503 }
    );
  }

  const result: EssayResult = {
    ...aiAnalysis.analysis,
    id: essayId,
    redacaoOriginal: trimmedEssay,
    createdAt: new Date().toISOString(),
    origem: 'IA',
  };

  try {
    await storeResult(supabase, result, userId);
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
}
