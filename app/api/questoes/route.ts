import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { Question } from "@/types";
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
    
    const disciplines = ['Matemática', 'Português', 'Química', 'Física', 'Geografia'];
    let allQuestions: Question[] = [];
    
    for (const discipline of disciplines) {
      const prompt = `
      Crie 2 questões de múltipla escolha sobre ${discipline} de nível ENEM para estudantes do ensino médio.
      
      Cada questão deve ter:
      1. Um enunciado claro
      2. Quatro alternativas (A, B, C, D)
      3. Apenas uma alternativa correta
      4. Uma breve explicação da resposta correta
      
      Responda APENAS em formato JSON, conforme estrutura abaixo, sem texto adicional:
      
      [
        {
          "discipline": "${discipline}",
          "text": "Enunciado da questão 1",
          "alternatives": [
            {"id": "A", "text": "Alternativa A", "isCorrect": false},
            {"id": "B", "text": "Alternativa B", "isCorrect": false},
            {"id": "C", "text": "Alternativa C", "isCorrect": true},
            {"id": "D", "text": "Alternativa D", "isCorrect": false}
          ],
          "explanation": "Explicação da resposta correta"
        },
        {
          "discipline": "${discipline}",
          "text": "Enunciado da questão 2",
          "alternatives": [
            {"id": "A", "text": "Alternativa A", "isCorrect": false},
            {"id": "B", "text": "Alternativa B", "isCorrect": true},
            {"id": "C", "text": "Alternativa C", "isCorrect": false},
            {"id": "D", "text": "Alternativa D", "isCorrect": false}
          ],
          "explanation": "Explicação da resposta correta"
        }
      ]`;
      
      // Usar fetch diretamente para obter resposta da API
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
          max_tokens: 2000,
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
      console.log(`AI response for ${discipline}:`, aiContent.substring(0, 100) + "...");
      
      // Parsear o JSON da resposta
      let questionsData: any[];
      
      try {
        // Primeiro, tenta parsear diretamente
        const parsedContent = JSON.parse(aiContent);
        questionsData = Array.isArray(parsedContent) ? parsedContent : parsedContent.questions || [];
        console.log(`Successfully parsed JSON for ${discipline}`);
      } catch (parseError) {
        console.error(`Failed direct JSON parse for ${discipline}, trying to extract JSON from text:`, parseError);
        
        // Se falhar, tenta extrair o JSON do texto
        const jsonMatch = aiContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                        aiContent.match(/(\[[\s\S]*\])/);
        
        if (!jsonMatch || !jsonMatch[1]) {
          console.error(`Could not extract JSON pattern from response for ${discipline}`);
          throw new Error(`Formato de resposta inválido da API para ${discipline}`);
        }
        
        const jsonContent = jsonMatch[1].trim();
        console.log(`Extracted JSON for ${discipline}:`, jsonContent.substring(0, 100) + "...");
        questionsData = JSON.parse(jsonContent);
      }
      
      // Adicionar IDs únicos e adicionar à lista geral
      const questionsWithIds = questionsData.map(q => ({
        ...q,
        id: uuidv4(),
        discipline: discipline as Question['discipline']
      }));
      
      allQuestions = [...allQuestions, ...questionsWithIds];
    }
    
    // Embaralhar as questões para não ficarem agrupadas por disciplina
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    
    return NextResponse.json({
      questions: shuffledQuestions
    });
    
  } catch (error) {
    console.error("Error in /api/questoes:", error);
    return NextResponse.json(
      { error: "Erro ao gerar questões", message: (error as Error).message },
      { status: 500 }
    );
  }
}
