import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { EssaySubmission, EssayResult, EssayResultResponse } from "@/types";
import { storeResult, getResult } from "@/lib/store";
import { Groq } from "groq-sdk";

export async function POST(request: NextRequest) {
  try {
    const body: EssaySubmission = await request.json();
    
    if (!body.redacao || body.redacao.trim().length < 50) {
      return NextResponse.json(
        { error: "A redação é muito curta" },
        { status: 400 }
      );
    }

    // Gerar um ID único para a submissão
    const id = uuidv4();
    
    // Preparar prompt para o Groq
    const prompt = `
    Você é um corretor especialista em redações do ENEM. Analise a seguinte redação sobre o tema "Os desafios da educação digital no Brasil contemporâneo" seguindo os 5 critérios de avaliação do ENEM:

    Competência 1: Domínio da norma padrão da língua escrita (0-200 pontos)
    Competência 2: Compreensão da proposta e aplicação de conceitos de várias áreas do conhecimento (0-200 pontos)
    Competência 3: Capacidade de selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista (0-200 pontos)
    Competência 4: Conhecimento dos mecanismos linguísticos para construção da argumentação (0-200 pontos)
    Competência 5: Elaboração de proposta de intervenção para o problema, respeitando os direitos humanos (0-200 pontos)

    REDAÇÃO DO ESTUDANTE:
    ${body.redacao}

    Forneça uma análise detalhada no seguinte formato JSON (sem explicações adicionais antes ou depois):
    {
      "nota": <nota total de 0 a 1000>,
      "competencia1": {
        "nota": <nota de 0 a 200>,
        "comentario": "<análise detalhada da competência 1>"
      },
      "competencia2": {
        "nota": <nota de 0 a 200>,
        "comentario": "<análise detalhada da competência 2>"
      },
      "competencia3": {
        "nota": <nota de 0 a 200>,
        "comentario": "<análise detalhada da competência 3>"
      },
      "competencia4": {
        "nota": <nota de 0 a 200>,
        "comentario": "<análise detalhada da competência 4>"
      },
      "competencia5": {
        "nota": <nota de 0 a 200>,
        "comentario": "<análise detalhada da competência 5>"
      },
      "feedbackGeral": "<feedback geral sobre a redação>",
      "pontoFortes": ["<ponto forte 1>", "<ponto forte 2>", "<ponto forte 3>"],
      "pontosAMelhorar": ["<ponto a melhorar 1>", "<ponto a melhorar 2>", "<ponto a melhorar 3>"]
    }
    `;

    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    let result: EssayResult;
    
    if (!groqApiKey) {
      console.warn("Groq API key not found, using mock data");
      // Modo de fallback para desenvolvimento
      result = {
        id,
        nota: 780,
        competencia1: {
          nota: 160,
          comentario: "Demonstra bom domínio da modalidade escrita formal da língua portuguesa, com poucos desvios gramaticais e de convenções da escrita."
        },
        competencia2: {
          nota: 160,
          comentario: "Desenvolve o tema por meio de argumentação consistente e apresenta bom domínio do texto dissertativo-argumentativo."
        },
        competencia3: {
          nota: 160,
          comentario: "Apresenta informações, fatos e opiniões relacionados ao tema, de forma organizada, com indícios de autoria."
        },
        competencia4: {
          nota: 150,
          comentario: "Articula as partes do texto com poucas inadequações e apresenta repertório diversificado de recursos coesivos."
        },
        competencia5: {
          nota: 150,
          comentario: "Elabora bem proposta de intervenção relacionada ao tema e articulada à discussão desenvolvida no texto."
        },
        feedbackGeral: "Seu texto apresenta boa estrutura argumentativa e aborda aspectos relevantes do tema proposto. Há alguns pontos que podem ser aprimorados para elevar ainda mais a qualidade da redação.",
        pontoFortes: [
          "Boa compreensão da proposta temática",
          "Argumentação consistente e lógica",
          "Repertório sociocultural adequado"
        ],
        pontosAMelhorar: [
          "Aprimorar alguns aspectos gramaticais e ortográficos",
          "Desenvolver mais a proposta de intervenção",
          "Melhorar a articulação entre os parágrafos"
        ],
        redacaoOriginal: body.redacao,
        createdAt: new Date().toISOString()
      };
    } else {
      try {
        // Usar fetch diretamente conforme o exemplo curl para compatibilidade
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile", // Modelo mais recente
            messages: [
              { role: "user", content: prompt }
            ],
            temperature: 0.2,
            max_tokens: 2000
          })
        });

        const responseData = await response.json();
        
        if (!response.ok) {
          console.error("Groq API error:", responseData);
          throw new Error(`Error from Groq API: ${responseData.error?.message || "Unknown error"}`);
        }

        // Extrair o conteúdo da resposta
        const aiContent = responseData.choices?.[0]?.message?.content || "";
        
        // Tenta parsear o JSON da resposta
        let aiResult: Partial<EssayResult>;
        try {
          // Extrair o JSON da resposta (pode estar entre codeblocks)
          const jsonMatch = aiContent.match(/```json\n([\s\S]*)\n```/) || aiContent.match(/({[\sS]*})/);
          const jsonContent = jsonMatch ? jsonMatch[1] : aiContent;
          aiResult = JSON.parse(jsonContent);
        } catch (e) {
          console.error("Error parsing AI response:", e);
          console.log("AI content:", aiContent);
          aiResult = {
            nota: 0,
            feedbackGeral: "Ocorreu um erro ao analisar sua redação. Por favor, tente novamente mais tarde."
          };
        }
        
        // Criar o resultado completo
        result = {
          id,
          nota: aiResult.nota || 0,
          competencia1: aiResult.competencia1 || { nota: 0, comentario: "Não foi possível avaliar" },
          competencia2: aiResult.competencia2 || { nota: 0, comentario: "Não foi possível avaliar" },
          competencia3: aiResult.competencia3 || { nota: 0, comentario: "Não foi possível avaliar" },
          competencia4: aiResult.competencia4 || { nota: 0, comentario: "Não foi possível avaliar" },
          competencia5: aiResult.competencia5 || { nota: 0, comentario: "Não foi possível avaliar" },
          feedbackGeral: aiResult.feedbackGeral || "Não foi possível gerar feedback",
          pontoFortes: aiResult.pontoFortes || [],
          pontosAMelhorar: aiResult.pontosAMelhorar || [],
          redacaoOriginal: body.redacao,
          createdAt: new Date().toISOString()
        };
      } catch (error) {
        console.error("Error calling Groq API:", error);
        throw new Error("Falha ao comunicar com a API de IA");
      }
    }
    
    // Armazenar o resultado usando a função do store
    storeResult(id, result);
    
    // Retornar apenas o ID como resposta para reduzir o tamanho da resposta
    const response: EssayResultResponse = { id };
    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error in /api/corrigir:", error);
    return NextResponse.json(
      { error: "Erro ao processar a redação", message: (error as Error).message },
      { status: 500 }
    );
  }
}

// Endpoint para buscar um resultado específico
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "ID não fornecido" },
      { status: 400 }
    );
  }
  
  const result = getResult(id);
  
  if (!result) {
    return NextResponse.json(
      { error: "Resultado não encontrado" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ result });
}
