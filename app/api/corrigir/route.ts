import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { EssaySubmission, EssayResult, EssayResultResponse } from "@/types";
import { storeResult, getResult } from "@/lib/store";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";
import { checkRateLimit } from "@/lib/rate-limit";
import { trackEvent } from "@/lib/analytics";
import { Groq } from 'groq-sdk';
import { supabase } from "@/lib/supabase";
import { extractUserIdFromToken } from "@/lib/server-auth";

const MAX_ESSAY_LENGTH = 5000;
const MIN_ESSAY_LENGTH = 50;

export async function POST(request: NextRequest) {
  try {
    // Obter IP do usuário para rate limiting
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Verificar rate limit (5 requisições por minuto)
    const rateLimitResult = await checkRateLimit(ip, '/api/corrigir', 5, 1);
    
    if (!rateLimitResult.allowed) {
      const resetTime = rateLimitResult.resetAt.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      return NextResponse.json(
        { 
          error: "Muitas requisições", 
          message: `Você atingiu o limite de requisições. Tente novamente após ${resetTime}.`,
          resetAt: rateLimitResult.resetAt.toISOString()
        },
        { status: 429 }
      );
    }
    
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

    const body: EssaySubmission = await request.json();
    
    // Validações aprimoradas
    if (!body.redacao || typeof body.redacao !== 'string') {
      return NextResponse.json(
        { error: "Redação inválida" },
        { status: 400 }
      );
    }
    
    const essayLength = body.redacao.trim().length;
    
    if (essayLength < MIN_ESSAY_LENGTH) {
      return NextResponse.json(
        { error: `A redação deve ter no mínimo ${MIN_ESSAY_LENGTH} caracteres` },
        { status: 400 }
      );
    }
    
    if (essayLength > MAX_ESSAY_LENGTH) {
      return NextResponse.json(
        { error: `A redação não pode exceder ${MAX_ESSAY_LENGTH} caracteres` },
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
    
    // Verificar se há usuário autenticado
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '').trim();

      userId = extractUserIdFromToken(token);

      if (!userId) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token);
          userId = user?.id || null;
        } catch (error) {
          console.log('Token inválido ou expirado');
          console.error('Erro ao validar token do usuário:', error);
        }
      }
    }
    
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
      console.log("Calling Groq API with SDK...");
      // Usar o SDK da Groq para chamadas mais robustas
      const groq = new Groq({ apiKey: groqApiKey });
      
      const apiResponse = await groq.chat.completions.create({
        messages: [
          { role: "user", content: prompt }
        ],
        model: "openai/gpt-oss-120b",
        temperature: 0.1, // Reduzir temperatura para aumentar determinismo
        max_completion_tokens: 8050, // Limite ajustado para 8050 tokens
        top_p: 1,
        stream: false,
        response_format: { type: "json_object" } // Forçar resposta em formato JSON
      });

      // Extrair o conteúdo da resposta
      const aiContent = apiResponse.choices?.[0]?.message?.content || "";
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
      
      // Armazenar o resultado usando a função do store (inclui user_id se autenticado)
      const resultWithUser = userId ? { ...result, user_id: userId } : result;
      await storeResult(id, resultWithUser);
      
      // Registrar evento de analytics
      await trackEvent('essay_submitted', {
        theme_type: body.usarTemaPadrao !== false ? 'padrao' : (body.tema ? 'personalizado' : 'gerado'),
        essay_length: essayLength,
        score: result.nota,
        tema: temaFinal
      }, ip, userAgent);
      
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
  // A consulta de resultados funcionará 24/7, sem restrição de horário
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  
  if (!id) {
    return NextResponse.json(
      { error: "ID não fornecido" },
      { status: 400 }
    );
  }
  
  const result = await getResult(id);
  
  if (!result) {
    return NextResponse.json(
      { error: "Resultado não encontrado" },
      { status: 404 }
    );
  }
  
  // Registrar visualização
  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  await trackEvent('essay_viewed', { essay_id: id }, ip, userAgent);
  
  return NextResponse.json({ result });
}
