import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { MultipleChoiceQuestion } from "@/types";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";

export async function GET(request: NextRequest) {
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

    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      console.error("Groq API key not found");
      return NextResponse.json(
        { error: "Serviço de geração de questões indisponível. Configure a API key." },
        { status: 503 }
      );
    }
    
    console.log("Calling Groq API to generate questions...");
    
    const prompt = `
    Gere 10 questões de múltipla escolha para um simulado estilo ENEM, sendo:
    - 2 de Matemática
    - 2 de Português
    - 2 de Química
    - 2 de Física
    - 2 de Geografia
    
    Cada questão deve ser de nível médio, adequada para estudantes do ensino médio, e deve:
    1. Ter um enunciado claro e contextualizado
    2. Ter 4 alternativas (a, b, c, d), com apenas uma correta
    3. Ter uma explicação sucinta sobre a alternativa correta
    
    Responda APENAS em formato JSON, conforme estrutura abaixo, sem texto adicional:
    {
      "questoes": [
        {
          "id": "id-único-1",
          "disciplina": "Matemática",
          "enunciado": "O enunciado da questão aqui...",
          "alternativas": {
            "a": "Alternativa A",
            "b": "Alternativa B",
            "c": "Alternativa C",
            "d": "Alternativa D"
          },
          "respostaCorreta": "a",
          "explicacao": "Explicação da resposta correta"
        },
        ...mais 9 questões seguindo o mesmo formato
      ]
    }`;
    
    // Usar fetch diretamente conforme o exemplo curl para compatibilidade
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-llama-70b", // Modelo mais recente
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 3000,
        response_format: { type: "json_object" } // Forçar resposta em formato JSON
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Groq API error:", responseData);
      throw new Error(`Error from Groq API: ${responseData.error?.message || "Unknown error"}`);
    }

    // Extrair o conteúdo da resposta
    const aiContent = responseData.choices?.[0]?.message?.content || "";
    console.log("AI raw response (first 200 chars):", aiContent.substring(0, 200) + "...");
    
    // Parsear o JSON da resposta
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(aiContent);
    } catch (error) {
      console.error("Failed to parse JSON from AI response:", error);
      throw new Error("Formato de resposta inválido da API");
    }
    
    // Verificar se as questões existem na resposta
    if (!jsonResponse.questoes || !Array.isArray(jsonResponse.questoes) || jsonResponse.questoes.length === 0) {
      console.error("No questions found in response:", jsonResponse);
      throw new Error("A resposta não contém questões válidas");
    }
    
    // Garantir que todas as questões tenham IDs únicos
    const questoes: MultipleChoiceQuestion[] = jsonResponse.questoes.map((q: any) => ({
      ...q,
      id: uuidv4() // Substituir qualquer ID que possa ter vindo na resposta
    }));
    
    // Garantir que temos o número correto de questões por disciplina
    const disciplinas = ["Matemática", "Português", "Química", "Física", "Geografia"];
    const questoesPorDisciplina = disciplinas.reduce<{[key: string]: MultipleChoiceQuestion[]}>((acc, disciplina) => {
      acc[disciplina] = questoes.filter(q => q.disciplina === disciplina);
      return acc;
    }, {});
    
    // Verificar se temos 2 questões de cada disciplina
    for (const disciplina of disciplinas) {
      if (questoesPorDisciplina[disciplina].length !== 2) {
        console.error(`Expected 2 questions of ${disciplina}, got ${questoesPorDisciplina[disciplina].length}`);
        throw new Error(`Erro na geração das questões: número incorreto de questões para ${disciplina}`);
      }
    }
    
    // Verificar se todas as questões têm os campos necessários
    for (const q of questoes) {
      if (!q.enunciado || !q.alternativas || !q.respostaCorreta) {
        console.error("Invalid question format:", q);
        throw new Error("Uma ou mais questões estão em formato inválido");
      }
      
      // Verificar se a resposta correta está entre as alternativas válidas
      if (!["a", "b", "c", "d"].includes(q.respostaCorreta)) {
        console.error(`Invalid correct answer: ${q.respostaCorreta}`);
        throw new Error("Uma ou mais questões têm resposta correta inválida");
      }
      
      // Verificar se todas as alternativas existem
      if (!q.alternativas.a || !q.alternativas.b || !q.alternativas.c || !q.alternativas.d) {
        console.error("Missing alternatives:", q.alternativas);
        throw new Error("Uma ou mais questões têm alternativas faltando");
      }
    }
    
    return NextResponse.json({ questoes });
    
  } catch (error) {
    console.error("Error in /api/gerar-questoes:", error);
    return NextResponse.json(
      { error: "Erro ao gerar questões", message: (error as Error).message },
      { status: 500 }
    );
  }
}
