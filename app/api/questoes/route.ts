import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { Question, QuizResult } from "@/types";
import type { Json } from "@/types/supabase";
import { buildGroqProviders, GroqProvider, isRateLimitError } from "@/lib/ai/groq";
import { getOperatingHoursInfo } from "@/lib/server/operating-hours";
import { resolveRequestUser } from "@/lib/server/auth-request";
import { createAdminClient } from "@/lib/db/server";

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

async function requestQuestionsForDiscipline(provider: GroqProvider, discipline: Question["discipline"]): Promise<Question[]> {
  const prompt = `
      Atue como um professor especialista no ENEM (Exame Nacional do Ensino Médio).
      Crie ${QUESTIONS_PER_DISCIPLINE} questões de múltipla escolha INÉDITAS e DE ALTA QUALIDADE sobre ${discipline}.
      
      Requisitos obrigatórios:
      1. Nível de dificuldade: Desafiador (estilo ENEM).
      2. Contextualização: As questões devem ter um texto base ou situação-problema, não apenas perguntas diretas.
      3. Estrutura: Enunciado claro, 4 alternativas (A, B, C, D) onde APENAS UMA é correta.
      4. Explicação: Forneça uma explicação detalhada (mini-aula) de por que a resposta correta é a certa e por que as outras estão erradas.
      
      Responda no seguinte formato JSON (sem markdown):
      {
        "questions": [
          {
            "discipline": "${discipline}",
            "text": "Texto base + Enunciado da questão",
            "alternatives": [
              {"id": "A", "text": "Texto da alternativa A", "isCorrect": false},
              {"id": "B", "text": "Texto da alternativa B", "isCorrect": false},
              {"id": "C", "text": "Texto da alternativa C", "isCorrect": true},
              {"id": "D", "text": "Texto da alternativa D", "isCorrect": false}
            ],
            "explanation": "Explicação detalhada."
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
      id: randomUUID(), // Will be overwritten by DB ID if we insert, but actually we use this ID for now.
      // Better to generate ID here, insert, and return SAME ID.
      discipline,
      text: question.text,
      explanation: question.explanation ?? "Sem explicação disponível.",
      alternatives,
    });
  }

  return normalized;
}

type GenerationDiagnostics = Record<Question["discipline"], string>;

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

async function saveGeneratedQuestions(questions: Question[]) {
  const supabase = createAdminClient();
  if (!supabase) {
    console.error("Admin client not available, skipping save generated questions.");
    return;
  }

  const rows = questions.map(q => ({
    id: q.id,
    discipline: q.discipline,
    content: q.text,
    alternatives: q.alternatives as unknown as Json,
    explanation: q.explanation,
    created_at: new Date().toISOString()
  }));

  // JSONB in Supabase JS: pass the object/array directly.
  const { error } = await supabase.from('generated_questions').insert(rows);
  if (error) {
    console.error("Error saving generated questions:", error);
  }
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

    // Save questions to DB
    await saveGeneratedQuestions(shuffled);

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
  if (!authHeader) {
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

  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    if (auth.error.status === 401) {
      return NextResponse.json({ success: true, saved: false, reason: "invalid_token" });
    }
    return auth.error;
  }

  const { supabase, userId } = auth;

  try {
    // 1. Insert Attempt
    const { data: attempt, error: attemptError } = await supabase.from("quiz_attempts").insert({
      user_id: userId,
      score: parsedPayload.result.score,
      total_questions: parsedPayload.result.totalQuestions,
      correct_answers: parsedPayload.result.correctAnswers,
      disciplines: parsedPayload.disciplines,
      started_at: new Date().toISOString(), // Approximation
      completed_at: new Date().toISOString()
    }).select().single();

    if (attemptError) throw attemptError;

    // 2. Insert Answers
    const answersToInsert = parsedPayload.questions.map(q => {
      const selectedId = parsedPayload.selectedAnswers[q.id];
      const isCorrect = q.alternatives.find(a => a.id === selectedId)?.isCorrect || false;
      return {
        attempt_id: attempt.id,
        question_id: q.id,
        selected_alternative_id: selectedId,
        is_correct: isCorrect
      };
    });

    const { error: answersError } = await supabase.from("quiz_answers").insert(answersToInsert);
    if (answersError) throw answersError;

    // 3. Update Stats
    const { error: statsError } = await supabase.rpc("recalculate_user_statistics", {
      target_user_id: userId,
    });

    if (statsError) {
      console.error("Erro ao recalcular estatísticas:", statsError);
    }

    return NextResponse.json({ success: true, saved: true });

  } catch (error) {
    console.error("Erro ao salvar resultado do simulado (nova estrutura):", error);
    return NextResponse.json(
      { error: "Erro ao salvar resultado do simulado", message: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}
