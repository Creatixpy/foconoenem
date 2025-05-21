import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { QuizResult, MultipleChoiceQuestion } from "@/types";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";
import { storeQuizResult } from "@/lib/quizStore";

interface SubmissionData {
  questoes: MultipleChoiceQuestion[];
  respostas: {
    [questionId: string]: "a" | "b" | "c" | "d";
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o sistema está em horário de funcionamento
    if (!isWithinOperatingHours()) {
      const { message, opensAt, closesAt } = getOperatingHoursInfo();
      return NextResponse.json(
        { 
          error: "Sistema fora do horário de funcionamento", 
          message: message,
          horarioFuncionamento: `${opensAt} - ${closesAt}`
        },
        { status: 403 } // Forbidden
      );
    }

    const body: SubmissionData = await request.json();
    
    if (!body.questoes || !Array.isArray(body.questoes) || body.questoes.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma questão fornecida" },
        { status: 400 }
      );
    }

    if (!body.respostas || Object.keys(body.respostas).length === 0) {
      return NextResponse.json(
        { error: "Nenhuma resposta fornecida" },
        { status: 400 }
      );
    }

    // Verificar se todas as questões foram respondidas
    for (const questao of body.questoes) {
      if (!body.respostas[questao.id]) {
        return NextResponse.json(
          { error: "Nem todas as questões foram respondidas" },
          { status: 400 }
        );
      }
    }

    // Calcular acertos
    let acertos = 0;
    for (const questao of body.questoes) {
      const resposta = body.respostas[questao.id];
      if (resposta === questao.respostaCorreta) {
        acertos++;
      }
    }

    // Calcular pontuação (escala de 0 a 1000)
    const pontuacao = Math.round((acertos / body.questoes.length) * 1000);

    // Gerar ID único para o resultado
    const id = uuidv4();

    // Criar objeto de resultado
    const result: QuizResult = {
      id,
      questoes: body.questoes,
      respostas: body.respostas,
      acertos,
      pontuacao,
      createdAt: new Date().toISOString()
    };

    // Armazenar o resultado
    storeQuizResult(id, result);

    // Retornar apenas o ID do resultado
    return NextResponse.json({ id });
    
  } catch (error) {
    console.error("Error in /api/corrigir-questoes:", error);
    return NextResponse.json(
      { error: "Erro ao processar as respostas", message: (error as Error).message },
      { status: 500 }
    );
  }
}
