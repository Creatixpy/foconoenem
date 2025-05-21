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
      
      Responda no seguinte formato JSON:
      {
        "questions": [
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
        ]
      }`;
      
      try {
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
          console.error(`Groq API error for ${discipline}:`, responseData);
          throw new Error(`Error from Groq API for ${discipline}: ${responseData.error?.message || "Unknown error"}`);
        }

        // Extrair o conteúdo da resposta
        const aiContent = responseData.choices?.[0]?.message?.content || "";
        console.log(`AI response for ${discipline}:`, aiContent.substring(0, 100) + "...");
        
        // Parsear o JSON da resposta
        let questionsData: any[] = [];
        
        try {
          // Primeiro, tenta parsear diretamente
          const parsedContent = JSON.parse(aiContent);
          
          // Verificar se a resposta contém o array 'questions'
          if (parsedContent.questions && Array.isArray(parsedContent.questions)) {
            questionsData = parsedContent.questions;
          } 
          // Ou se a própria resposta é um array
          else if (Array.isArray(parsedContent)) {
            questionsData = parsedContent;
          }
          // Ou se a resposta tem o campo 'data' contendo questões
          else if (parsedContent.data && Array.isArray(parsedContent.data)) {
            questionsData = parsedContent.data;
          }
          // Se não encontrar em nenhum formato conhecido, lança erro
          else {
            throw new Error(`JSON response for ${discipline} doesn't contain expected structure`);
          }
          
          console.log(`Successfully parsed JSON for ${discipline}, found ${questionsData.length} questions`);
        } catch (parseError) {
          console.error(`Failed direct JSON parse for ${discipline}, trying to extract JSON from text:`, parseError);
          
          // Se falhar, tenta extrair o JSON do texto e procurar pelo array de questões
          try {
            const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                            aiContent.match(/(\{[\s\S]*\})/);
            
            if (!jsonMatch || !jsonMatch[1]) {
              throw new Error(`Could not extract JSON pattern from response for ${discipline}`);
            }
            
            const jsonContent = jsonMatch[1].trim();
            console.log(`Extracted JSON for ${discipline}:`, jsonContent.substring(0, 100) + "...");
            
            const extractedObject = JSON.parse(jsonContent);
            
            // Tentar encontrar o array de questões no objeto extraído
            if (extractedObject.questions && Array.isArray(extractedObject.questions)) {
              questionsData = extractedObject.questions;
            } else if (Array.isArray(extractedObject)) {
              questionsData = extractedObject;
            } else if (extractedObject.data && Array.isArray(extractedObject.data)) {
              questionsData = extractedObject.data;
            } else {
              throw new Error(`Extracted JSON for ${discipline} doesn't contain expected structure`);
            }
          } catch (extractError) {
            console.error(`Failed extraction attempt for ${discipline}:`, extractError);
            
            // Última tentativa: procurar por um array JSON diretamente
            const arrayMatch = aiContent.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/) || 
                              aiContent.match(/(\[[\s\S]*\])/);
                              
            if (!arrayMatch || !arrayMatch[1]) {
              throw new Error(`Could not extract array pattern from response for ${discipline}`);
            }
            
            const arrayContent = arrayMatch[1].trim();
            console.log(`Extracted array for ${discipline}:`, arrayContent.substring(0, 100) + "...");
            questionsData = JSON.parse(arrayContent);
          }
        }
        
        // Verificação adicional para garantir que temos dados válidos
        if (!questionsData || !Array.isArray(questionsData) || questionsData.length === 0) {
          throw new Error(`No valid questions found in response for ${discipline}`);
        }
        
        // Adicionar IDs únicos e adicionar à lista geral
        const questionsWithIds = questionsData.map(q => ({
          ...q,
          id: uuidv4(),
          // Garante que o campo discipline tenha o valor correto
          discipline: discipline as Question['discipline']
        }));
        
        // Verificar se cada questão tem todas as propriedades necessárias
        for (const q of questionsWithIds) {
          // Se não tiver texto ou alternativas, ignorar esta questão
          if (!q.text || !q.alternatives || !Array.isArray(q.alternatives) || q.alternatives.length < 4) {
            console.warn(`Skipping invalid question in ${discipline}:`, q);
            continue;
          }
          
          // Garantir que exista uma explicação, mesmo que vazia
          if (!q.explanation) {
            q.explanation = "Sem explicação disponível.";
          }
          
          // Garantir que exista pelo menos uma alternativa correta
          const hasCorrectAlternative = q.alternatives.some((alt: { isCorrect: any; }) => alt.isCorrect);
          if (!hasCorrectAlternative) {
            console.warn(`Question without correct alternative in ${discipline}, setting first as correct:`, q);
            q.alternatives[0].isCorrect = true;
          }
          
          // Adicionar à lista global de questões
          allQuestions.push(q as Question);
        }
        
        console.log(`Added ${questionsWithIds.length} questions for ${discipline}`);
        
      } catch (disciplineError) {
        // Registrar erro para esta disciplina, mas continuar com as outras
        console.error(`Error generating questions for ${discipline}:`, disciplineError);
        // Não falhar completamente, continuar para a próxima disciplina
      }
    }
    
    // Verificar se temos questões suficientes
    if (allQuestions.length === 0) {
      return NextResponse.json(
        { error: "Não foi possível gerar nenhuma questão válida" },
        { status: 500 }
      );
    }
    
    // Garantir que temos pelo menos uma questão de cada disciplina
    const disciplineCounts = disciplines.map(disc => {
      return {
        discipline: disc,
        count: allQuestions.filter(q => q.discipline === disc).length
      };
    });
    
    console.log("Questions by discipline:", disciplineCounts);
    
    // Embaralhar as questões para não ficarem agrupadas por disciplina
    const shuffledQuestions = allQuestions.sort(() => Math.random() - 0.5);
    
    // Limitar a 10 questões (2 de cada disciplina idealmente)
    const finalQuestions = shuffledQuestions.slice(0, 10);
    
    return NextResponse.json({
      questions: finalQuestions,
      totalQuestions: finalQuestions.length,
      disciplineCounts: disciplineCounts
    });
    
  } catch (error) {
    console.error("Error in /api/questoes:", error);
    return NextResponse.json(
      { error: "Erro ao gerar questões", message: (error as Error).message },
      { status: 500 }
    );
  }
}
