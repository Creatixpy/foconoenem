"use strict";

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";
import { Groq } from "npm:groq-sdk";

type OperatingHoursInfo = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  currentTime: string;
  usedFallback: boolean;
};

type QuestionAlternative = {
  id: string;
  text: string;
  isCorrect: boolean;
};

type Question = {
  id: string;
  discipline: "Matemática" | "Português" | "Química" | "Física" | "Geografia";
  text: string;
  explanation: string;
  alternatives: QuestionAlternative[];
};

type RawAlternative = {
  id?: string;
  text?: string;
  isCorrect?: boolean;
};

type RawQuestion = {
  discipline?: string;
  text?: string;
  explanation?: string;
  alternatives?: RawAlternative[];
};

type QuizResultPayload = {
  user_id?: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  score: number;
  questions: Question[];
  answers: Record<string, string>;
  disciplines: string[];
  created_at?: string;
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
const QUESTIONS_PER_DISCIPLINE = 3;

const ALL_DISCIPLINES: Question["discipline"][] = [
  "Matemática",
  "Português",
  "Química",
  "Física",
  "Geografia",
];

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

function ensureGroqClient(): Groq {
  if (!GROQ_API_KEY) {
    throw new Error("Groq API key não configurada.");
  }
  return new Groq({ apiKey: GROQ_API_KEY });
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

async function storeQuizResult(payload: QuizResultPayload) {
  const { error } = await supabase.from("quiz_results").insert({
    user_id: payload.user_id ?? null,
    total_questions: payload.total_questions,
    correct_answers: payload.correct_answers,
    wrong_answers: payload.wrong_answers,
    unanswered_questions: payload.unanswered_questions,
    score: payload.score,
    questions_data: payload.questions,
    answers_data: payload.answers,
    disciplines: payload.disciplines,
    created_at: payload.created_at ?? new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

async function recalculateUserStatistics(userId: string | null) {
  if (!userId) {
    return;
  }

  const { error } = await supabase.rpc("recalculate_user_statistics", {
    target_user_id: userId,
  });

  if (error) {
    console.error("Erro ao atualizar estatísticas do usuário:", error);
  }
}

async function generateQuestions(disciplines: Question["discipline"][]): Promise<Question[]> {
  const groq = ensureGroqClient();
  const questions: Question[] = [];

  for (const discipline of disciplines) {
    const prompt = `
      Crie ${QUESTIONS_PER_DISCIPLINE} questões de múltipla escolha sobre ${discipline} de nível ENEM para estudantes do ensino médio.
      
      Cada questão deve ter:
      1. Um enunciado claro
      2. Quatro alternativas (A, B, C, D)
      3. Apenas uma alternativa correta
      4. Uma breve explicação da resposta correta
      
      Responda no seguinte formato JSON:
      {
        "questions": [
          {
            "discipline": "${discipline}",
            "text": "Enunciado da questão",
            "alternatives": [
              {"id": "A", "text": "Alternativa A", "isCorrect": false},
              {"id": "B", "text": "Alternativa B", "isCorrect": false},
              {"id": "C", "text": "Alternativa C", "isCorrect": true},
              {"id": "D", "text": "Alternativa D", "isCorrect": false}
            ],
            "explanation": "Explicação da resposta correta"
          }
        ]
      }
      
      Certifique-se de gerar exatamente ${QUESTIONS_PER_DISCIPLINE} questões distintas no array "questions".
    `;

    try {
      const response = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "openai/gpt-oss-120b",
        temperature: 0.7,
        max_completion_tokens: 8050,
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" },
      });

      const aiContent = response.choices?.[0]?.message?.content ?? "";
      let questionsData: RawQuestion[] = [];

      try {
        const parsedContent = JSON.parse(aiContent);
        if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
          questionsData = parsedContent.questions;
        } else if (Array.isArray(parsedContent)) {
          questionsData = parsedContent;
        } else if (parsedContent.data && Array.isArray(parsedContent.data)) {
          questionsData = parsedContent.data;
        } else {
          throw new Error("Estrutura inesperada");
        }
      } catch (parseError) {
        console.error("Falha ao parsear JSON direto:", parseError);
        const jsonMatch =
          aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
          aiContent.match(/(\{[\s\S]*\})/);

        if (!jsonMatch || !jsonMatch[1]) {
          const arrayMatch =
            aiContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
            aiContent.match(/(\[[\s\S]*\])/);
          if (!arrayMatch || !arrayMatch[1]) {
            throw new Error("Não foi possível extrair JSON das questões.");
          }
          questionsData = JSON.parse(arrayMatch[1].trim());
        } else {
          const extracted = JSON.parse(jsonMatch[1].trim());
          if (extracted.questions && Array.isArray(extracted.questions)) {
            questionsData = extracted.questions;
          } else if (Array.isArray(extracted)) {
            questionsData = extracted;
          } else if (extracted.data && Array.isArray(extracted.data)) {
            questionsData = extracted.data;
          } else {
            throw new Error("Estrutura inesperada");
          }
        }
      }

      for (const q of questionsData) {
        if (!q.text || !Array.isArray(q.alternatives) || q.alternatives.length < 4) continue;

        const normalizedAlternatives: QuestionAlternative[] = q.alternatives.map((alt, index) => {
          const letter = String.fromCharCode(65 + index);
          return {
            id: alt?.id ?? letter,
            text: alt?.text ?? `Alternativa ${letter}`,
            isCorrect: Boolean(alt?.isCorrect),
          };
        });

        if (!normalizedAlternatives.some((alt) => alt.isCorrect)) {
          normalizedAlternatives[0].isCorrect = true;
        }

        questions.push({
          id: crypto.randomUUID(),
          discipline,
          text: q.text,
          explanation: q.explanation ?? "Sem explicação disponível.",
          alternatives: normalizedAlternatives,
        });
      }
    } catch (error) {
      console.error(`Erro ao gerar questões de ${discipline}:`, error);
    }
  }

  return questions;
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
    try {
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

      const url = new URL(request.url);
      const disciplinesParam = url.searchParams.get("disciplines");
      const disciplines = disciplinesParam
        ? disciplinesParam
            .split(",")
            .map((d) => d.trim())
            .filter((d): d is Question["discipline"] => ALL_DISCIPLINES.includes(d as any))
        : ALL_DISCIPLINES;

      if (disciplines.length === 0) {
        return new Response(JSON.stringify({ error: "Pelo menos uma disciplina deve ser selecionada" }), {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 400,
        });
      }

      const allQuestions = await generateQuestions(disciplines);

      if (allQuestions.length === 0) {
        return new Response(JSON.stringify({ error: "Não foi possível gerar nenhuma questão válida" }), {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 500,
        });
      }

      const balancedQuestions = disciplines.flatMap((discipline) =>
        allQuestions
          .filter((question) => question.discipline === discipline)
          .slice(0, QUESTIONS_PER_DISCIPLINE)
      );

      const limitedQuestions =
        balancedQuestions.length > 0 ? balancedQuestions : allQuestions.slice(0, QUESTIONS_PER_DISCIPLINE * disciplines.length);

      const shuffledQuestions = [...limitedQuestions].sort(() => Math.random() - 0.5);

      const disciplineCounts = disciplines.map((disc) => ({
        discipline: disc,
        count: shuffledQuestions.filter((q) => q.discipline === disc).length,
      }));

      return new Response(
        JSON.stringify({
          questions: shuffledQuestions,
          totalQuestions: shuffledQuestions.length,
          disciplineCounts,
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 200,
        }
      );
    } catch (error) {
      console.error("Erro ao gerar questões:", error);
      return new Response(
        JSON.stringify({
          error: "Erro ao gerar questões",
          message: error instanceof Error ? error.message : "Erro desconhecido",
        }),
        {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 500,
        }
      );
    }
  }

  // POST handler
  try {
    const body = await request.json();
    const { result, selectedAnswers, questions, disciplines } = body ?? {};

    if (!result || !Array.isArray(questions) || typeof selectedAnswers !== "object" || selectedAnswers === null) {
      return new Response(JSON.stringify({ error: "Dados do resultado inválidos" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 400,
      });
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
      return new Response(JSON.stringify({ success: true, saved: false, reason: "not_authenticated" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 200,
      });
    }

    const token = authHeader.slice("bearer ".length).trim();
    let userId = extractUserIdFromToken(token);

    if (!userId) {
      try {
        const { data, error } = await supabase.auth.getUser(token);
        if (error) throw error;
        userId = data?.user?.id ?? null;
      } catch (error) {
        console.error("Erro ao validar token do usuário para resultado do simulado:", error);
        return new Response(JSON.stringify({ success: true, saved: false, reason: "invalid_token" }), {
          headers: { "content-type": "application/json; charset=utf-8" },
          status: 200,
        });
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ success: true, saved: false, reason: "user_not_found" }), {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 200,
      });
    }

    await storeQuizResult({
      user_id: userId,
      total_questions: Number(result.totalQuestions) || questions.length,
      correct_answers: Number(result.correctAnswers) || 0,
      wrong_answers: Number(result.wrongAnswers) || 0,
      unanswered_questions: Number(result.unansweredQuestions) || 0,
      score: Number(result.score) || 0,
      questions,
      answers: selectedAnswers,
      disciplines: Array.isArray(disciplines) ? disciplines : [],
      created_at: new Date().toISOString(),
    });

    await recalculateUserStatistics(userId);

    return new Response(JSON.stringify({ success: true, saved: true }), {
      headers: { "content-type": "application/json; charset=utf-8" },
      status: 200,
    });
  } catch (error) {
    console.error("Erro ao salvar resultado do simulado:", error);
    return new Response(
      JSON.stringify({
        error: "Erro ao salvar resultado do simulado",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      }),
      {
        headers: { "content-type": "application/json; charset=utf-8" },
        status: 500,
      }
    );
  }
});
