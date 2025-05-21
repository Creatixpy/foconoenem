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
    
    console.log("Chamando API para gerar questões...");
    
    const prompt = `
    Crie 10 questões de múltipla escolha para um simulado do ENEM com o seguinte formato:
    - 2 questões de Matemática
    - 2 questões de Português
    - 2 questões de Química
    - 2 questões de Física
    - 2 questões de Geografia
    
    As questões devem ser adequadas para o nível do ENEM e ter 5 alternativas (A, B, C, D, E).
    Inclua uma explicação completa para a resposta correta.
    
    REGRAS IMPORTANTES:
    1. As questões de matemática podem incluir fórmulas, mas devem ser compreensíveis em formato texto
    2. As questões de português podem incluir interpretação textual ou gramática
    3. As questões devem ter um formato compatível com o ENEM, com contextualização adequada
    4. Inclua apenas problemas com uma única resposta correta
    5. As alternativas devem ser plausivelmente erradas, não evidentemente incorretas
    
    Responda APENAS em formato JSON, conforme estrutura abaixo:
    {
      "questions": [
        {
          "id": "id-único",
          "subject": "matematica", // ou "portugues", "quimica", "fisica", "geografia"
          "question": "Texto completo da questão...",
          "options": [
            "Alternativa A", 
            "Alternativa B", 
            "Alternativa C", 
            "Alternativa D", 
            "Alternativa E"
          ],
          "correctAnswer": 0, // Índice da alternativa correta (0 a 4 para A a E)
          "explanation": "Explicação detalhada da resposta correta..."
        },
        // mais 9 questões no mesmo formato
      ]
    }`;
    
    // Usar fetch para chamar a API do Groq
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "deepseek-r1-distill-llama-70b",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Groq API error:", responseData);
      throw new Error(`Error from Groq API: ${responseData.error?.message || "Unknown error"}`);
    }

    // Extrair o conteúdo da resposta
    const aiContent = responseData.choices?.[0]?.message?.content || "";
    console.log("AI raw response:", aiContent.substring(0, 200) + "...");
    
    // Parsear o JSON da resposta
    let aiResult: { questions: MultipleChoiceQuestion[] };
    
    try {
      // Tentar parsear diretamente
      aiResult = JSON.parse(aiContent);
      console.log("Successfully parsed JSON directly");
    } catch (parseError) {
      console.error("Failed direct JSON parse, trying to extract JSON from text:", parseError);
      
      // Se falhar, tentar extrair o JSON do texto
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                      aiContent.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch || !jsonMatch[1]) {
        console.error("Could not extract JSON pattern from response");
        throw new Error("Formato de resposta inválido da API");
      }
      
      const jsonContent = jsonMatch[1].trim();
      console.log("Extracted JSON:", jsonContent.substring(0, 200) + "...");
      aiResult = JSON.parse(jsonContent);
    }
    
    // Verificar se o formato está correto
    if (!aiResult.questions || !Array.isArray(aiResult.questions) || aiResult.questions.length < 10) {
      console.error("Invalid question format:", aiResult);
      throw new Error("A resposta da API não contém questões suficientes");
    }
    
    // Adicionar IDs únicos para cada questão, se não existirem
    const questions = aiResult.questions.map(q => ({
      ...q,
      id: q.id || uuidv4()
    }));
    
    return NextResponse.json({ questions });
    
  } catch (error) {
    console.error("Error in /api/gerar-questoes:", error);
    return NextResponse.json(
      { error: "Erro ao gerar questões", message: (error as Error).message },
      { status: 500 }
    );
  }
}
