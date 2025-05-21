import { NextRequest, NextResponse } from "next/server";
import { getQuizResult } from "@/lib/quizStore";
import { QuizResultResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const segments = url.pathname.split("/");
    const id = segments.pop() || "";

    if (!id) {
      return NextResponse.json(
        { error: "ID não fornecido" },
        { status: 400 }
      );
    }

    const result = getQuizResult(id);

    if (!result) {
      return NextResponse.json(
        { error: "Resultado não encontrado" },
        { status: 404 }
      );
    }

    const response: QuizResultResponse = { id, result };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar resultado do quiz:", error);
    return NextResponse.json(
      { error: "Erro interno ao buscar resultado" },
      { status: 500 }
    );
  }
}
