import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { EssaySubmission, EssayResult, EssayResultResponse } from "@/types";
import { storeResult, getResult } from "@/lib/store";

export async function POST(request: NextRequest) {
  try {
    const body: EssaySubmission = await request.json();
    
    if (!body.redacao || body.redacao.trim().length < 50) {
      return NextResponse.json(
        { error: "A redação é muito curta" },
        { status: 400 }
      );
    }

    // Verifica se está usando tema personalizado e se ele foi fornecido
    if (body.usarTemaPadrao === false && (!body.tema || body.tema.trim().length < 5)) {
      return NextResponse.json(
        { error: "É necessário fornecer um tema personalizado válido" },
        { status: 400 }
      );
    }

    // Gerar um ID único para a submissão
    const id = uuidv4();
    
    // Determinar o tema e textos de apoio a serem usados
    const temaPadrao = "Os desafios da educação digital no Brasil contemporâneo";
    const textoApoio1Padrao = "Segundo dados do IBGE, em 2021, 85% dos domicílios brasileiros possuíam acesso à internet, porém com grande disparidade regional e socioeconômica. Nas regiões Norte e Nordeste, e em famílias de baixa renda, o acesso é significativamente menor.";
    const textoApoio2Padrao = "A pandemia de COVID-19 evidenciou a necessidade de integração digital no ensino, mas também mostrou que muitos estudantes e professores não estão preparados para o uso efetivo das tecnologias educacionais.";
    
    const temaFinal = body.usarTemaPadrao !== false ? temaPadrao : body.tema;
    const textoApoio1Final = body.usarTemaPadrao !== false ? textoApoio1Padrao : (body.textoApoio1 || "");
    const textoApoio2Final = body.usarTemaPadrao !== false ? textoApoio2Padrao : (body.textoApoio2 || "");
    
    // Preparar prompt para o Groq
    let prompt = `
    Você é um corretor especialista em redações do ENEM. Analise a seguinte redação sobre o tema "${temaFinal}" seguindo os 5 critérios de avaliação do ENEM:

    Competência 1: Domínio da norma padrão da língua escrita (0-200 pontos)
    Competência 2: Compreensão da proposta e aplicação de conceitos de várias áreas do conhecimento (0-200 pontos)
    Competência 3: Capacidade de selecionar, relacionar, organizar e interpretar informações em defesa de um ponto de vista (0-200 pontos)
    Competência 4: Conhecimento dos mecanismos linguísticos para construção da argumentação (0-200 pontos)
    Competência 5: Elaboração de proposta de intervenção para o problema, respeitando os direitos humanos (0-200 pontos)
    `;

    // Adicionar textos de apoio ao prompt, se disponíveis
    if (textoApoio1Final) {
      prompt += `\nTEXTO DE APOIO I:\n${textoApoio1Final}\n`;
    }
    
    if (textoApoio2Final) {
      prompt += `\nTEXTO DE APOIO II:\n${textoApoio2Final}\n`;
    }

    prompt += `
    REDAÇÃO DO ESTUDANTE:
    ${body.redacao}

    Você deve responder APENAS com um objeto JSON válido, sem texto antes ou depois, com os seguintes campos, sem usar markdown:
    {
      "nota": número de 0 a 1000,
      "competencia1": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 1"
      },
      "competencia2": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 2"
      },
      "competencia3": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 3"
      },
      "competencia4": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 4"
      },
      "competencia5": {
        "nota": número de 0 a 200,
        "comentario": "análise detalhada da competência 5"
      },
      "feedbackGeral": "feedback geral sobre a redação",
      "pontoFortes": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
      "pontosAMelhorar": ["ponto a melhorar 1", "ponto a melhorar 2", "ponto a melhorar 3"]
    }
    
    LEMBRE-SE: Sua resposta deve ser apenas o objeto JSON, sem qualquer outro texto.
    `;

    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      console.error("Groq API key not found");
      return NextResponse.json(
        { error: "Serviço de correção temporariamente indisponível. Configure a API key." },
        { status: 503 }
      );
    }
    
    try {
      console.log("Calling Groq API...");
      // Usar fetch diretamente conforme o exemplo curl para compatibilidade
      const apiResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
          temperature: 0.1, // Reduzir temperatura para aumentar determinismo
          max_tokens: 2000,
          response_format: { type: "json_object" } // Forçar resposta em formato JSON
        })
      });

      const responseData = await apiResponse.json();
      
      if (!apiResponse.ok) {
        console.error("Groq API error:", responseData);
        throw new Error(`Error from Groq API: ${responseData.error?.message || "Unknown error"}`);
      }

      // Extrair o conteúdo da resposta
      const aiContent = responseData.choices?.[0]?.message?.content || "";
      console.log("AI raw response:", aiContent.substring(0, 200) + "...");
      
      // Tenta parsear o JSON da resposta
      let aiResult: Partial<EssayResult>;
      try {
        // Primeiro, tenta parsear diretamente - já deve estar em formato JSON
        aiResult = JSON.parse(aiContent);
        console.log("Successfully parsed JSON directly");
      } catch (parseError) {
        console.error("Failed direct JSON parse, trying to extract JSON from text:", parseError);
        
        try {
          // Se falhar, tenta extrair o JSON do texto
          const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                          aiContent.match(/(\{[\s\S]*\})/);
          
          if (!jsonMatch || !jsonMatch[1]) {
            console.error("Could not extract JSON pattern from response");
            throw new Error("Formato de resposta inválido da API");
          }
          
          const jsonContent = jsonMatch[1].trim();
          console.log("Extracted JSON:", jsonContent.substring(0, 200) + "...");
          aiResult = JSON.parse(jsonContent);
        } catch (extractError) {
          console.error("Failed to extract and parse JSON:", extractError);
          throw new Error("Não foi possível processar a resposta da API");
        }
      }
      
      // Verificar se os campos importantes existem
      if (!aiResult.nota || !aiResult.feedbackGeral) {
        console.error("Missing required fields in AI result:", aiResult);
        throw new Error("A resposta da API está incompleta");
      }
      
      // Criar o resultado completo
      const result: EssayResult = {
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
        createdAt: new Date().toISOString(),
        origem: "IA", // Indicar que foi avaliado pela IA
        tema: temaFinal,
        textoApoio1: textoApoio1Final,
        textoApoio2: textoApoio2Final
      };
      
      // Armazenar o resultado usando a função do store
      storeResult(id, result);
      
      // Retornar apenas o ID como resposta para reduzir o tamanho da resposta
      const responseObj: EssayResultResponse = { id };
      return NextResponse.json(responseObj);
      
    } catch (error) {
      console.error("Error calling Groq API:", error);
      return NextResponse.json(
        { error: "Erro ao analisar sua redação", message: (error as Error).message },
        { status: 500 }
      );
    }
    
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
