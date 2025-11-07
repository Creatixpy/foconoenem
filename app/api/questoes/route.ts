import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Question, QuizResult } from "@/types";

const functionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/quiz-handler`
  : null;

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const DISCIPLINES: Question["discipline"][] = ["Matemática", "Português", "Química", "Física", "Geografia"];

function buildHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  if (anonKey) {
    headers.set("apikey", anonKey);
    if (!authHeader) {
      headers.set("authorization", `Bearer ${anonKey}`);
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    headers.set("x-real-ip", realIp);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  return headers;
}

export async function GET(request: NextRequest) {
  if (!functionUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL não configurada." },
      { status: 500 }
    );
  }

  const url = new URL(functionUrl);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildHeaders(request),
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}

export async function POST(request: NextRequest) {
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json(
      { error: "Variáveis NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY não configuradas." },
      { status: 500 }
    );
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return NextResponse.json({ success: true, saved: false, reason: "not_authenticated" });
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return NextResponse.json({ success: true, saved: false, reason: "not_authenticated" });
  }

  let payload: {
    result?: QuizResult;
    selectedAnswers?: Record<string, string>;
    questions?: Question[];
    disciplines?: string[];
  };

  try {
    payload = (await request.json()) as typeof payload;
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const { result, selectedAnswers, questions, disciplines } = payload ?? {};

  if (
    !result ||
    typeof result !== "object" ||
    typeof result.totalQuestions !== "number" ||
    typeof result.correctAnswers !== "number" ||
    typeof result.wrongAnswers !== "number" ||
    typeof result.unansweredQuestions !== "number" ||
    typeof result.score !== "number"
  ) {
    return NextResponse.json({ error: "Dados do resultado inválidos" }, { status: 400 });
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "Lista de questões inválida" }, { status: 400 });
  }

  if (!selectedAnswers || typeof selectedAnswers !== "object") {
    return NextResponse.json({ error: "Mapa de respostas inválido" }, { status: 400 });
  }

  const normalizedDisciplines = Array.isArray(disciplines)
    ? disciplines.filter((item): item is Question["discipline"] =>
        typeof item === "string" ? DISCIPLINES.includes(item as Question["discipline"]) : false
      )
    : [];

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false },
    global: {
      headers: { Authorization: `Bearer ${token}` },
    },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({ success: true, saved: false, reason: "invalid_token" });
  }

  const userId = userData.user.id;
  if (!userId) {
    return NextResponse.json({ success: true, saved: false, reason: "user_not_found" });
  }

  const insertPayload = {
    user_id: userId,
    total_questions: Number.isFinite(result.totalQuestions) ? result.totalQuestions : questions.length,
    correct_answers: Number.isFinite(result.correctAnswers) ? result.correctAnswers : 0,
    wrong_answers: Number.isFinite(result.wrongAnswers) ? result.wrongAnswers : 0,
    unanswered_questions: Number.isFinite(result.unansweredQuestions) ? result.unansweredQuestions : 0,
    score: Number.isFinite(result.score) ? result.score : 0,
    questions_data: questions,
    answers_data: selectedAnswers,
    disciplines: normalizedDisciplines,
    created_at: new Date().toISOString(),
  };

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
