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

type CachedTheme = {
  id: string;
  tema: string;
  texto_apoio1: string;
  texto_apoio2: string;
  usado_count: number;
  created_at: string;
};

type GroqProvider = {
  name: string;
  client: Groq;
  model: string;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";
const GROQ_MODEL = Deno.env.get("GROQ_MODEL") ?? "openai/gpt-oss-120b";
const GROQ_FALLBACK_API_KEY = Deno.env.get("GROQ_FALLBACK_API_KEY") ?? "";
const GROQ_FALLBACK_MODEL = Deno.env.get("GROQ_FALLBACK_MODEL") ?? "llama3-70b-8192";
const parsedAttempts = Number(Deno.env.get("GROQ_MAX_ATTEMPTS") ?? "2");
const GROQ_MAX_ATTEMPTS = Number.isFinite(parsedAttempts) && parsedAttempts > 0 ? parsedAttempts : 2;

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

function formatBrazilTime(date: Date, format: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: BRAZIL_TZ,
    ...format,
  }).format(date);
}

async function getOperatingHoursInfo(): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilNow();
  const isOpen = evaluateOperatingHours(now);

  const openingTimeToday = new Date(now);
  const { hour, minute } = extractHourMinute(now);
  const offsetMinutes = hour * 60 + minute;

  const openMinutes = OPEN_HOUR * 60;
  const closeMinutes = CLOSE_HOUR * 60 + CLOSE_MINUTE;

  const minutesSinceMidnight = offsetMinutes;

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
  userAgent?: string,
  userId?: string | null
) {
  try {
    const mergedMetadata = userId ? { ...metadata, user_id: userId } : metadata;
    const { error } = await supabase.from("analytics_events").insert({
      event_type: eventType,
      metadata: mergedMetadata,
      user_ip: userIp,
      user_agent: userAgent,
      user_id: userId ?? null,
    });
    if (error) {
      console.error("Erro ao registrar evento de analytics:", error);
    }
  } catch (error) {
    console.error("Erro inesperado ao registrar evento:", error);
  }
}

async function getCachedTheme(): Promise<CachedTheme | null> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("cached_themes")
    .select("*")
    .gte("created_at", oneDayAgo)
    .order("usado_count", { ascending: true })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar tema em cache:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const { error: updateError } = await supabase
    .from("cached_themes")
    .update({ usado_count: (data.usado_count ?? 0) + 1 })
    .eq("id", data.id);

  if (updateError) {
    console.error("Erro ao atualizar contador de cache:", updateError);
  }

  return data as CachedTheme;
}

async function cacheTheme(tema: string, textoApoio1: string, textoApoio2: string) {
  const { error } = await supabase.from("cached_themes").insert({
    tema,
    texto_apoio1: textoApoio1,
    texto_apoio2: textoApoio2,
    usado_count: 1,
  });

  if (error) {
    console.error("Erro ao armazenar tema em cache:", error);
  }
}

function createGroqProvider(apiKey: string | null, model: string, name: string): GroqProvider | null {
  if (!apiKey) {
    return null;
  }
  return {
    name,
    client: new Groq({ apiKey }),
    model,
  };
}

function buildGroqProviders(): GroqProvider[] {
  const providers: GroqProvider[] = [];
  const primary = createGroqProvider(GROQ_API_KEY || null, GROQ_MODEL, "primary");
  if (!primary) {
    throw new Error("Groq API key não configurada.");
  }
  providers.push(primary);

  const fallback = createGroqProvider(
    GROQ_FALLBACK_API_KEY ? GROQ_FALLBACK_API_KEY : null,
    GROQ_FALLBACK_MODEL,
    "fallback"
  );
  if (fallback) {
    providers.push(fallback);
  }

  return providers;
}

function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  if (typeof error === "object" && error && "status" in error && (error as { status?: number }).status === 429) {
    return true;
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);
  return message.toLowerCase().includes("rate limit");
}

async function requestThemeFromProvider(provider: GroqProvider): Promise<{
  tema: string;
  textoApoio1: string;
  textoApoio2: string;
}> {

  const prompt = `
    Gere um tema relevante para uma redação de estilo ENEM (Exame Nacional do Ensino Médio). 
    
    O tema deve:
    1. Ser atual e relevante para a sociedade brasileira
    2. Ter caráter sociocultural, científico, político ou ambiental
    3. Permitir uma discussão argumentativa
    4. Ser apresentado como uma afirmação ou pergunta direta
    
    Além do tema, gere dois textos de apoio curtos (um parágrafo cada) com informações factuais ou opiniões que contextualizem o tema.
    
    Responda APENAS em formato JSON, conforme estrutura abaixo, sem texto adicional:
    {
      "tema": "O tema da redação aqui",
      "textoApoio1": "Primeiro texto de apoio factual",
      "textoApoio2": "Segundo texto de apoio com outro ponto de vista"
    }`;

  const response = await provider.client.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: provider.model,
    temperature: 0.7,
    max_completion_tokens: 8050,
    top_p: 1,
    stream: false,
    response_format: { type: "json_object" },
  });

  const aiContent = response.choices?.[0]?.message?.content ?? "";

  let parsed: {
    tema?: string;
    textoApoio1?: string;
    textoApoio2?: string;
  };

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

  if (!parsed.tema || !parsed.textoApoio1 || !parsed.textoApoio2) {
    throw new Error("Resposta da IA não contém todos os campos necessários.");
  }

  return {
    tema: parsed.tema,
    textoApoio1: parsed.textoApoio1,
    textoApoio2: parsed.textoApoio2,
  };
}

async function generateThemeWithGroq(): Promise<{
  tema: string;
  textoApoio1: string;
  textoApoio2: string;
  provider: string;
}> {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;
    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const theme = await requestThemeFromProvider(provider);
        return { ...theme, provider: provider.name };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === "string"
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

  const finalError = new Error(attemptsLog.join(" | ") || "Falha ao gerar tema com IA");
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
}

Deno.serve(async (request) => {
  if (request.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método não permitido." }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 405,
    });
  }

  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent") ?? "unknown";

  try {
    const rateResult = await checkRateLimit(ip, "/functions/generate-theme", 3, 1);
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

    const cached = await getCachedTheme();
    if (cached) {
      await trackEvent(
        "theme_cached",
        {
          tema: cached.tema,
          cache_age_hours:
            Math.floor((Date.now() - new Date(cached.created_at).getTime()) / (1000 * 60 * 60)),
        },
        ip,
        userAgent
      );

      return new Response(
        JSON.stringify({
          tema: cached.tema,
          textoApoio1: cached.texto_apoio1,
          textoApoio2: cached.texto_apoio2,
          cached: true,
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 200,
        }
      );
    }

    let generated: { tema: string; textoApoio1: string; textoApoio2: string; provider: string };
    try {
      generated = await generateThemeWithGroq();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const attempts =
        error && typeof error === "object" && "attemptsLog" in error
          ? ((error as { attemptsLog?: string[] }).attemptsLog ?? undefined)
          : undefined;
      console.error("Erro ao gerar tema com IA:", error);
      return new Response(
        JSON.stringify({
          error: "Erro ao gerar tema",
          message: "Nossa IA não respondeu a tempo. Tente novamente em alguns instantes.",
          diagnostics: {
            stage: "generateThemeWithGroq",
            detail,
            attempts,
          },
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 503,
        }
      );
    }

    await cacheTheme(generated.tema, generated.textoApoio1, generated.textoApoio2);
    await trackEvent("theme_generated", { tema: generated.tema, provider: generated.provider }, ip, userAgent);

    return new Response(
      JSON.stringify({
        ...generated,
        cached: false,
      }),
      {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erro na função generate-theme:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao gerar tema",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 500,
      }
    );
  }
});
