"use strict";

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";
import { Groq } from "npm:groq-sdk";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
};

type OperatingHoursInfo = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  currentTime: string;
  usedFallback: boolean;
};

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
  origem: "IA" | "Simulação";
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
};

type EssayRow = {
  id: string;
  nota: number;
  competencia1: EssayCompetence;
  competencia2: EssayCompetence;
  competencia3: EssayCompetence;
  competencia4: EssayCompetence;
  competencia5: EssayCompetence;
  feedback_geral: string;
  ponto_fortes: string[] | null;
  pontos_a_melhorar: string[] | null;
  redacao_original: string;
  created_at: string;
  origem: "IA" | "Simulação";
  tema: string | null;
  texto_apoio1: string | null;
  texto_apoio2: string | null;
  user_id: string | null;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const BRAZIL_TZ = "America/Sao_Paulo";
const OPEN_HOUR = 7;
const CLOSE_HOUR = 23;
const CLOSE_MINUTE = 30;
const MAX_ESSAY_LENGTH = 5000;
const MIN_ESSAY_LENGTH = 50;

const DEFAULT_THEME = "Os desafios da educação digital no Brasil contemporâneo";
const DEFAULT_TEXT_1 =
  "Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, e em famílias de baixa renda, o acesso é significativamente menor.";
const DEFAULT_TEXT_2 =
  "A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.";

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

async function getBrazilNow(): Promise<{ now: Date; usedFallback: boolean }> {
  try {
    const response = await fetch("https://worldtimeapi.org/api/timezone/America/Sao_Paulo", {
      headers: { "cache-control": "no-cache" },
    });
    if (response.ok) {
      const data = await response.json();
      const date = new Date(data.datetime);
      if (!Number.isNaN(date.getTime())) {
        return { now: date, usedFallback: false };
      }
    }
  } catch (error) {
    console.warn("Falha ao sincronizar horário com worldtimeapi:", error);
  }
  return { now: new Date(), usedFallback: true };
}

function extractHourMinute(date: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  return { hour, minute };
}

function evaluateOperatingHours(date: Date): boolean {
  const { hour, minute } = extractHourMinute(date);
  if (hour < OPEN_HOUR) return false;
  if (hour > CLOSE_HOUR) return false;
  if (hour === CLOSE_HOUR && minute >= CLOSE_MINUTE) return false;
  return true;
}

function formatBrazilTime(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TZ,
    ...options,
  }).format(date);
}

async function getOperatingHoursInfo(): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilNow();
  const isOpen = evaluateOperatingHours(now);

  const { hour, minute } = extractHourMinute(now);
  const minutesSinceMidnight = hour * 60 + minute;
  const openMinutes = OPEN_HOUR * 60;
  const closeMinutes = CLOSE_HOUR * 60 + CLOSE_MINUTE;

  let referenceTime = new Date(now);
  if (isOpen) {
    const diffMinutes = closeMinutes - minutesSinceMidnight;
    referenceTime = new Date(now.getTime() + diffMinutes * 60 * 1000);
  } else if (minutesSinceMidnight < openMinutes) {
    const diffMinutes = openMinutes - minutesSinceMidnight;
    referenceTime = new Date(now.getTime() + diffMinutes * 60 * 1000);
  } else {
    const minutesUntilNextDayOpen = 24 * 60 - minutesSinceMidnight + openMinutes;
    referenceTime = new Date(now.getTime() + minutesUntilNextDayOpen * 60 * 1000);
  }

  const currentTime = formatBrazilTime(now, { hour: "2-digit", minute: "2-digit" });
  const nextOpenTime = formatBrazilTime(referenceTime, {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const baseMessage = isOpen
    ? `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`
    : `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`;

  const message = usedFallback
    ? `${baseMessage} · Atualizado com horário local (falha na sincronização com o serviço externo).`
    : baseMessage;

  return {
    isOpen,
    opensAt: "07:00",
    closesAt: "23:30",
    nextOpenTime,
    message,
    currentTime,
    usedFallback,
  };
}

async function checkRateLimit(
  identifier: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("rate_limits")
    .select("id, window_start")
    .eq("identifier", identifier)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart)
    .order("window_start", { ascending: true });

  if (error) {
    console.error("Erro ao consultar rate limit:", error);
    const reset = new Date(Date.now() + windowMinutes * 60 * 1000);
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: reset,
    };
  }

  const totalRequests = data?.length ?? 0;
  if (totalRequests >= maxRequests) {
    const oldest = data![0];
    const resetAt = new Date(new Date(oldest.window_start).getTime() + windowMinutes * 60 * 1000);
    return {
      allowed: false,
      remaining: 0,
      resetAt,
    };
  }

  const { error: insertError } = await supabase.from("rate_limits").insert({
    identifier,
    endpoint,
    request_count: 1,
    window_start: new Date().toISOString(),
  });

  if (insertError) {
    console.error("Erro ao registrar rate limit:", insertError);
  }

  return {
    allowed: true,
    remaining: maxRequests - totalRequests - 1,
    resetAt: new Date(Date.now() + windowMinutes * 60 * 1000),
  };
}

async function trackEvent(
  eventType: string,
  metadata: Record<string, unknown>,
  userIp?: string,
  userAgent?: string
) {
  try {
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      metadata,
      user_ip: userIp,
      user_agent: userAgent,
    });
    if (error) {
      console.error("Erro ao registrar evento de analytics:", error);
    }
  } catch (error) {
    console.error("Erro inesperado ao registrar evento:", error);
  }
}

function extractUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payloadSegment = parts[1];
    const payloadJson = atob(payloadSegment.replace(/-/g, "+").replace(/_/g, "/"));
    const payload = JSON.parse(payloadJson);
    return payload?.sub ?? payload?.user_id ?? null;
  } catch (error) {
    console.error("Failed to decode Supabase JWT:", error);
    return null;
  }
}

async function storeResult(result: EssayResult, userId: string | null) {
  const payload = {
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
    origem: result.origem,
    tema: result.tema ?? null,
    texto_apoio1: result.textoApoio1 ?? null,
    texto_apoio2: result.textoApoio2 ?? null,
    created_at: result.createdAt,
    user_id: userId,
  };

  const { error } = await supabase.from("essay_results").insert(payload);
  if (error) {
    throw error;
  }
}

function normalizeEssayRow(row: EssayRow): EssayResult {
  return {
    id: row.id,
    nota: row.nota,
    competencia1: row.competencia1,
    competencia2: row.competencia2,
    competencia3: row.competencia3,
    competencia4: row.competencia4,
    competencia5: row.competencia5,
    feedbackGeral: row.feedback_geral,
    pontoFortes: row.ponto_fortes ?? [],
    pontosAMelhorar: row.pontos_a_melhorar ?? [],
    redacaoOriginal: row.redacao_original,
    createdAt: row.created_at,
    origem: row.origem,
    tema: row.tema ?? undefined,
    textoApoio1: row.texto_apoio1 ?? undefined,
    textoApoio2: row.texto_apoio2 ?? undefined,
  };
}

async function getResult(id: string): Promise<EssayResult | null> {
  const { data, error } = await supabase
    .from("essay_results")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar resultado:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeEssayRow(data as EssayRow);
}

function ensureGroqClient(): Groq {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key não configurada.");
  }
  return new Groq({ apiKey: GROQ_API_KEY });
}

async function analyseEssay(input: {
  submission: EssaySubmission;
  temaFinal: string;
  textoApoio1Final: string;
  textoApoio2Final: string;
  essayId: string;
}): Promise<Omit<EssayResult, "createdAt" | "origem">> {
  const { submission, temaFinal, textoApoio1Final, textoApoio2Final, essayId } = input;
  const groq = ensureGroqClient();

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

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.1,
    max_completion_tokens: 8050,
    top_p: 1,
    stream: false,
    response_format: { type: "json_object" },
  });

  const aiContent = response.choices?.[0]?.message?.content ?? "";

  let parsed: Partial<EssayResult>;
  try {
    parsed = JSON.parse(aiContent);
  } catch (parseError) {
    console.error("Falha ao parsear JSON diretamente:", parseError);
    const jsonMatch =
      aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      aiContent.match(/(\{[\s\S]*\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Formato de resposta inválido da API");
    }

    parsed = JSON.parse(jsonMatch[1].trim());
  }

  if (!parsed.nota || !parsed.feedbackGeral) {
    throw new Error("A resposta da IA está incompleta.");
  }

  return {
    id: essayId,
    nota: parsed.nota,
    competencia1: parsed.competencia1 ?? { nota: 0, comentario: "Não foi possível avaliar" },
    competencia2: parsed.competencia2 ?? { nota: 0, comentario: "Não foi possível avaliar" },
    competencia3: parsed.competencia3 ?? { nota: 0, comentario: "Não foi possível avaliar" },
    competencia4: parsed.competencia4 ?? { nota: 0, comentario: "Não foi possível avaliar" },
    competencia5: parsed.competencia5 ?? { nota: 0, comentario: "Não foi possível avaliar" },
    feedbackGeral: parsed.feedbackGeral ?? "Não foi possível gerar feedback",
    pontoFortes: parsed.pontoFortes ?? [],
    pontosAMelhorar: parsed.pontosAMelhorar ?? [],
    redacaoOriginal: submission.redacao,
    tema: temaFinal,
    textoApoio1: textoApoio1Final,
    textoApoio2: textoApoio2Final,
  };
}

Deno.serve(async (request) => {
  const method = request.method.toUpperCase();

  if (method !== "GET" && method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 405,
    });
  }

  if (method === "GET") {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    if (!id) {
      return new Response(JSON.stringify({ error: "ID não fornecido" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 400,
      });
    }

    const result = await getResult(id);
    if (!result) {
      return new Response(JSON.stringify({ error: "Resultado não encontrado" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 404,
      });
    }

    await trackEvent("essay_viewed", { essay_id: id }, getClientIp(request), request.headers.get("user-agent") ?? "unknown");

    return new Response(JSON.stringify({ result }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 200,
    });
  }

  // POST handling
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  try {
    const rateResult = await checkRateLimit(ip, "/functions/correct-essay", 5, 1);
    if (!rateResult.allowed) {
      return new Response(
        JSON.stringify({
          error: "Muitas requisições",
          message: `Você atingiu o limite de requisições. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 429,
        }
      );
    }

    const operatingInfo = await getOperatingHoursInfo();
    if (!operatingInfo.isOpen) {
      return new Response(
        JSON.stringify({
          error: "Sistema fora do horário de funcionamento",
          message: operatingInfo.message,
          horarioFuncionamento: `${operatingInfo.opensAt} - ${operatingInfo.closesAt}`,
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 403,
        }
      );
    }

    const body = (await request.json()) as EssaySubmission;

    if (!body.redacao || typeof body.redacao !== "string") {
      return new Response(JSON.stringify({ error: "Redação inválida" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 400,
      });
    }

    const trimmedEssay = body.redacao.trim();
    const essayLength = trimmedEssay.length;

    if (essayLength < MIN_ESSAY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `A redação deve ter no mínimo ${MIN_ESSAY_LENGTH} caracteres` }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 400,
        }
      );
    }

    if (essayLength > MAX_ESSAY_LENGTH) {
      return new Response(
        JSON.stringify({ error: `A redação não pode exceder ${MAX_ESSAY_LENGTH} caracteres` }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 400,
        }
      );
    }

    if (body.usarTemaPadrao === false && (!body.tema || body.tema.trim().length < 5)) {
      return new Response(
        JSON.stringify({ error: "É necessário fornecer um tema personalizado válido" }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 400,
        }
      );
    }

    const essayId = crypto.randomUUID();
    const temaFinal = body.usarTemaPadrao !== false ? DEFAULT_THEME : body.tema ?? DEFAULT_THEME;
    const textoApoio1Final = body.usarTemaPadrao !== false ? DEFAULT_TEXT_1 : body.textoApoio1 ?? "";
    const textoApoio2Final = body.usarTemaPadrao !== false ? DEFAULT_TEXT_2 : body.textoApoio2 ?? "";

    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader?.toLowerCase().startsWith("bearer ")) {
      const token = authHeader.slice("bearer ".length).trim();
      userId = extractUserIdFromToken(token);
      if (!userId) {
        try {
          const { data, error } = await supabase.auth.getUser(token);
          if (error) throw error;
          userId = data?.user?.id ?? null;
        } catch (error) {
          console.error("Erro ao validar token do usuário:", error);
          userId = null;
        }
      }
    }

    const aiResult = await analyseEssay({
      submission: { ...body, redacao: trimmedEssay },
      temaFinal,
      textoApoio1Final,
      textoApoio2Final,
      essayId,
    });

    const result: EssayResult = {
      ...aiResult,
      id: essayId,
      redacaoOriginal: trimmedEssay,
      createdAt: new Date().toISOString(),
      origem: "IA",
    };

    await storeResult(result, userId);

    await trackEvent(
      "essay_submitted",
      {
        theme_type: body.usarTemaPadrao !== false ? "padrao" : body.tema ? "personalizado" : "gerado",
        essay_length: essayLength,
        score: result.nota,
        tema: temaFinal,
      },
      ip,
      userAgent
    );

    return new Response(JSON.stringify({ id: essayId }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro na função correct-essay:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao processar a redação",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 500,
      }
    );
  }
});
