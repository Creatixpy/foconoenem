import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Question, QuizResult } from "@/types";
import type { Database, Json } from "@/types/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";
import { buildGroqProviders, GroqProvider, isRateLimitError } from "@/lib/ai/groq";
import { getOperatingHoursInfo } from "@/lib/server/operating-hours";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { extractUserIdFromToken } from "@/lib/server/jwt";

const DISCIPLINES: Question["discipline"][] = ["Matemática", "Português", "Química", "Física", "Geografia"];
const QUESTIONS_PER_DISCIPLINE = 3;
const MAX_ATTEMPTS_PER_DISCIPLINE = 2;

type QuizRequestPayload = {
  result: QuizResult;
  selectedAnswers: Record<string, string>;
  questions: Question[];
  disciplines: Question["discipline"][];
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

function assertQuizPayload(payload: unknown): QuizRequestPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload ausente ou inválido");
  }

  const { result, selectedAnswers, questions, disciplines } = payload as Record<string, unknown>;

  if (!result || typeof result !== "object") {
    throw new Error("Dados do resultado inválidos");
  }

  const castResult = result as QuizResult;
  const requiredNumbers: Array<keyof QuizResult> = [
    "totalQuestions",
    "correctAnswers",
    "wrongAnswers",
    "unansweredQuestions",
    "score",
  ];
  for (const key of requiredNumbers) {
    if (typeof castResult[key] !== "number") {
      throw new Error("Dados do resultado inválidos");
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("Lista de questões inválida");
  }

  if (!selectedAnswers || typeof selectedAnswers !== "object") {
    throw new Error("Mapa de respostas inválido");
  }

  const normalizedDisciplines = Array.isArray(disciplines)
    ? (disciplines.filter((item): item is Question["discipline"] =>
        typeof item === "string" ? DISCIPLINES.includes(item as Question["discipline"]) : false)
      )
    : [];

  return {
    result: castResult,
    selectedAnswers: selectedAnswers as Record<string, string>,
    questions: questions as Question[],
    disciplines: normalizedDisciplines,
  };
}

function buildInsertPayload(userId: string, payload: QuizRequestPayload) {
  const { result, questions, selectedAnswers, disciplines } = payload;

  return {
    user_id: userId,
    total_questions: Number.isFinite(result.totalQuestions) ? result.totalQuestions : questions.length,
    correct_answers: Number.isFinite(result.correctAnswers) ? result.correctAnswers : 0,
    wrong_answers: Number.isFinite(result.wrongAnswers) ? result.wrongAnswers : 0,
    unanswered_questions: Number.isFinite(result.unansweredQuestions) ? result.unansweredQuestions : 0,
    score: Number.isFinite(result.score) ? result.score : 0,
    questions_data: questions as unknown as Json[],
    answers_data: selectedAnswers as unknown as Json,
    disciplines,
    created_at: new Date().toISOString(),
  };
}

async function resolveUserId(token: string, supabase: SupabaseClient<Database>): Promise<string | null> {
  const decoded = extractUserIdFromToken(token);
  if (decoded) {
    return decoded;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) {
      throw error;
    }
    return data?.user?.id ?? null;
  } catch (error) {
    console.error("Erro ao validar token do usuário:", error);
    return null;
  }
}

type GenerationDiagnostics = Record<Question["discipline"], string>;

async function requestQuestionsForDiscipline(provider: GroqProvider, discipline: Question["discipline"]): Promise<Question[]> {
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
  let rawQuestions: RawQuestion[] = [];

  try {
    const parsed = JSON.parse(aiContent);
    if (Array.isArray(parsed)) {
      rawQuestions = parsed;
    } else if (Array.isArray(parsed.questions)) {
      rawQuestions = parsed.questions;
    } else if (Array.isArray(parsed.data)) {
      rawQuestions = parsed.data;
    } else {
      throw new Error("Estrutura inesperada");
    }
  } catch (parseError) {
    console.error("Falha ao parsear JSON direto:", parseError);
    const blockMatch =
      aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      aiContent.match(/(\{[\s\S]*\})/);

    if (blockMatch?.[1]) {
      const extracted = JSON.parse(blockMatch[1].trim());
      if (Array.isArray(extracted)) {
        rawQuestions = extracted;
      } else if (Array.isArray(extracted.questions)) {
        rawQuestions = extracted.questions;
      } else if (Array.isArray(extracted.data)) {
        rawQuestions = extracted.data;
      } else {
        throw new Error("Estrutura inesperada");
      }
    } else {
      const arrayMatch =
        aiContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) ||
        aiContent.match(/(\[[\s\S]*\])/);
      if (!arrayMatch?.[1]) {
        throw new Error("Não foi possível extrair JSON das questões.");
      }
      rawQuestions = JSON.parse(arrayMatch[1].trim());
    }
  }

  const normalized: Question[] = [];
  for (const question of rawQuestions) {
    if (!question.text || !Array.isArray(question.alternatives) || question.alternatives.length < 4) {
      continue;
    }

    const alternatives = question.alternatives.map((alternative, index) => {
      const letter = String.fromCharCode(65 + index);
      return {
        id: alternative?.id ?? letter,
        text: alternative?.text ?? `Alternativa ${letter}`,
        isCorrect: Boolean(alternative?.isCorrect),
      };
    });

    if (!alternatives.some((alternative) => alternative.isCorrect)) {
      alternatives[0].isCorrect = true;
    }

    normalized.push({
      id: randomUUID(),
      discipline,
      text: question.text,
      explanation: question.explanation ?? "Sem explicação disponível.",
      alternatives,
    });
  }

  return normalized;
}

async function generateQuestionsWithDiagnostics(
  disciplines: Question["discipline"][]
): Promise<{
  questions: Question[];
  diagnostics: GenerationDiagnostics;
  missing: Question["discipline"][];
  providersUsed: Record<string, string>;
}> {
  const providers = buildGroqProviders();
  const diagnostics: GenerationDiagnostics = {} as GenerationDiagnostics;
  const missing: Question["discipline"][] = [];
  const providersUsed: Record<string, string> = {};
  const questions: Question[] = [];

  for (const discipline of disciplines) {
    let disciplineQuestions: Question[] | null = null;
    let lastError: string | null = null;

    for (let providerIndex = 0; providerIndex < providers.length && !disciplineQuestions; providerIndex++) {
      const provider = providers[providerIndex];
      let attempts = 0;

      while (attempts < MAX_ATTEMPTS_PER_DISCIPLINE && !disciplineQuestions) {
        attempts++;
        try {
          const generated = await requestQuestionsForDiscipline(provider, discipline);
          if (generated.length >= QUESTIONS_PER_DISCIPLINE) {
            disciplineQuestions = generated.slice(0, QUESTIONS_PER_DISCIPLINE);
            providersUsed[discipline] = provider.name;
          } else {
            lastError = `(${provider.name}) Recebemos ${generated.length} questão(ões)`;
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === "string"
                ? error
                : "Falha desconhecida ao consultar o modelo";
          lastError = `(${provider.name}) ${message}`;
          console.error(`Erro ao gerar questões de ${discipline} com ${provider.name} (tentativa ${attempts}):`, error);

          if (isRateLimitError(error) && providerIndex < providers.length - 1) {
            break;
          }
        }
      }
    }

    if (disciplineQuestions) {
      questions.push(...disciplineQuestions);
    } else {
      diagnostics[discipline] = lastError ?? "Falha ao gerar questões";
      missing.push(discipline);
    }
  }

  return { questions, diagnostics, missing, providersUsed };
}

export async function GET(request: NextRequest) {
  try {
    const operatingInfo = await getOperatingHoursInfo();
    if (!operatingInfo.isOpen) {
      return NextResponse.json(
        {
          error: "Sistema fora do horário de funcionamento",
          message: operatingInfo.message,
          horarioFuncionamento: `${operatingInfo.opensAt} - ${operatingInfo.closesAt}`,
        },
        { status: 403 }
      );
    }

    const disciplinesParam = request.nextUrl.searchParams.get("disciplines");
    const disciplines = disciplinesParam
      ? disciplinesParam
          .split(",")
          .map((item) => item.trim())
          .filter((item): item is Question["discipline"] => DISCIPLINES.includes(item as Question["discipline"]))
      : DISCIPLINES;

    if (disciplines.length === 0) {
      return NextResponse.json({ error: "Pelo menos uma disciplina deve ser selecionada" }, { status: 400 });
    }

    const { questions: aiQuestions, diagnostics, missing, providersUsed } = await generateQuestionsWithDiagnostics(disciplines);

    if (missing.length > 0 || aiQuestions.length === 0) {
      return NextResponse.json(
        {
          error: "Não foi possível gerar questões para todas as disciplinas",
          message: "Nossa IA não respondeu a tempo para todas as áreas selecionadas. Tente novamente em instantes.",
          diagnostics,
          missing_disciplines: missing,
          providers_used: providersUsed,
        },
        { status: 503 }
      );
    }

    const balanced = disciplines.flatMap((discipline) =>
      aiQuestions.filter((question) => question.discipline === discipline).slice(0, QUESTIONS_PER_DISCIPLINE)
    );

    const selected = balanced.length > 0
      ? balanced
      : aiQuestions.slice(0, QUESTIONS_PER_DISCIPLINE * disciplines.length);

    const shuffled = [...selected].sort(() => Math.random() - 0.5);

    return NextResponse.json({
      questions: shuffled,
      totalQuestions: shuffled.length,
      disciplineCounts: disciplines.map((discipline) => ({
        discipline,
        count: shuffled.filter((question) => question.discipline === discipline).length,
      })),
      diagnostics,
      providersUsed,
    });
  } catch (error) {
    console.error("Erro ao gerar questões:", error);
    return NextResponse.json(
      {
        error: "Erro ao gerar questões",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ success: true, saved: false, reason: "not_authenticated" });
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ success: true, saved: false, reason: "not_authenticated" });
  }

  let parsedPayload: QuizRequestPayload;
  try {
    const raw = await request.json();
    parsedPayload = assertQuizPayload(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "JSON inválido";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role não configurado." },
      { status: 500 }
    );
  }

  const userId = await resolveUserId(token, supabase);
  if (!userId) {
    return NextResponse.json({ success: true, saved: false, reason: "invalid_token" });
  }

  const insertPayload = buildInsertPayload(userId, parsedPayload);

  const { error: insertError } = await supabase.from("quiz_results").insert(insertPayload);
  if (insertError) {
    console.error("Erro ao inserir quiz_results:", insertError);
    return NextResponse.json(
      { error: "Erro ao salvar resultado do simulado", message: insertError.message },
      { status: 500 }
    );
  }

  const { error: statsError } = await supabase.rpc("recalculate_user_statistics", {
    target_user_id: userId,
  });
  if (statsError) {
    console.error("Erro ao recalcular estatísticas:", statsError);
  }

  return NextResponse.json({ success: true, saved: true });
}
