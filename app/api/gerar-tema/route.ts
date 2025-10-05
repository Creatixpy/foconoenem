import { NextRequest, NextResponse } from "next/server";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";
import { getCachedTheme, cacheTheme } from "@/lib/cache";
import { trackEvent } from "@/lib/analytics";
import { checkRateLimit } from "@/lib/rate-limit";
import { Groq } from 'groq-sdk';

export async function GET(request: NextRequest) {
  try {
    // Obter IP do usuário para rate limiting e analytics
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    
    // Verificar rate limit (3 requisições por minuto para geração de tema)
    const rateLimitResult = await checkRateLimit(ip, '/api/gerar-tema', 3, 1);
    
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
    
    // Tentar buscar tema do cache primeiro
    const cachedTheme = await getCachedTheme();
    
    if (cachedTheme) {
      console.log("Usando tema do cache:", cachedTheme.tema);
      
      // Registrar uso de tema em cache
      await trackEvent('theme_cached', {
        tema: cachedTheme.tema,
        cache_age_hours: Math.floor(
          (Date.now() - new Date(cachedTheme.created_at).getTime()) / (1000 * 60 * 60)
        )
      }, ip, userAgent);
      
      return NextResponse.json({
        tema: cachedTheme.tema,
        textoApoio1: cachedTheme.texto_apoio1,
        textoApoio2: cachedTheme.texto_apoio2,
        cached: true
      });
    }

    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      console.error("Groq API key not found");
      return NextResponse.json(
        { error: "Serviço de geração de temas indisponível. Configure a API key." },
        { status: 503 }
      );
    }
    
    console.log("Calling Groq API to generate theme...");
    
    const prompt = `
    Gere um tema relevante para uma redação de estilo ENEM (Exame Nacional do Ensino Médio). 
    
    O tema deve:
    1. Ser atual e relevante para a sociedade brasileira
    2. Ter caráter sociocultural, científico, político ou ambiental
    3. Permitir uma discussão argumentativa
    4. Ser apresentado como uma afirmação ou pergunta direta
    
    Além do tema, gere dois textos de apoio curtos (um parágrafo cada) com informações factuais ou opiniões que contextualizem o tema.
    
    Responda APENAS em formato JSON, conforme estrutura abaixo, sem texto adicional:
    {
      "tema": "O tema da redação aqui",
      "textoApoio1": "Primeiro texto de apoio factual",
      "textoApoio2": "Segundo texto de apoio com outro ponto de vista"
    }`;
    
    // Usar o SDK da Groq para chamadas mais robustas
    const groq = new Groq({ apiKey: groqApiKey });
    
    console.log("Calling Groq API to generate theme with SDK...");
    
    const response = await groq.chat.completions.create({
      messages: [
        { role: "user", content: prompt }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7, // Um pouco mais de criatividade para gerar temas diversos
      max_completion_tokens: 8050, // Limite ajustado para 8050 tokens
      top_p: 1,
      stream: false,
      response_format: { type: "json_object" } // Forçar resposta em formato JSON
    });

    // Extrair o conteúdo da resposta
    const aiContent = response.choices?.[0]?.message?.content || "";
    console.log("AI raw response:", aiContent.substring(0, 200) + "...");
    
    // Parsear o JSON da resposta
    let aiResult: {
      tema: string;
      textoApoio1: string;
      textoApoio2: string;
    };
    
    try {
      // Primeiro, tenta parsear diretamente
      aiResult = JSON.parse(aiContent);
      console.log("Successfully parsed JSON directly");
    } catch (parseError) {
      console.error("Failed direct JSON parse, trying to extract JSON from text:", parseError);
      
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
    }
    
    // Verificar se os campos importantes existem
    if (!aiResult.tema || !aiResult.textoApoio1 || !aiResult.textoApoio2) {
      console.error("Missing required fields in AI result:", aiResult);
      throw new Error("A resposta da API está incompleta");
    }
    
    const result = {
      tema: aiResult.tema,
      textoApoio1: aiResult.textoApoio1,
      textoApoio2: aiResult.textoApoio2,
      cached: false
    };
    
    // Armazenar no cache para uso futuro
    await cacheTheme(aiResult.tema, aiResult.textoApoio1, aiResult.textoApoio2);
    
    // Registrar geração de tema
    await trackEvent('theme_generated', {
      tema: aiResult.tema
    }, ip, userAgent);
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Error in /api/gerar-tema:", error);
    return NextResponse.json(
      { error: "Erro ao gerar tema", message: (error as Error).message },
      { status: 500 }
    );
  }
}
