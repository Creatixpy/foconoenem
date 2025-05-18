import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;
    
    // Lista de temas pré-definidos caso a API falhe
    const temasPadroes = [
      "Os desafios da educação digital no Brasil contemporâneo",
      "A questão da mobilidade urbana sustentável nas grandes cidades brasileiras",
      "Impactos da desinformação na sociedade democrática",
      "Desigualdade social e seus efeitos na saúde pública no Brasil",
      "O papel da tecnologia na transformação do mercado de trabalho contemporâneo",
      "Preservação ambiental e desenvolvimento econômico: caminhos para a sustentabilidade",
      "Os desafios da inclusão de pessoas com deficiência no Brasil",
      "Saúde mental e qualidade de vida na sociedade contemporânea",
      "Acesso à cultura como direito fundamental do cidadão brasileiro",
      "Alimentação saudável e segurança alimentar: desafios para o Brasil"
    ];
    
    let result: {
      tema: string;
      textoApoio1: string;
      textoApoio2: string;
    };
    
    if (!groqApiKey) {
      console.warn("Groq API key not found, using random theme from predefined list");
      // Modo de fallback para desenvolvimento
      const temaSelecionado = temasPadroes[Math.floor(Math.random() * temasPadroes.length)];
      
      result = {
        tema: temaSelecionado,
        textoApoio1: "Texto de apoio simulado 1 relacionado ao tema.",
        textoApoio2: "Texto de apoio simulado 2 relacionado ao tema."
      };
    } else {
      try {
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
            temperature: 0.7, // Um pouco mais de criatividade para gerar temas diversos
            max_tokens: 1000,
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
        
        result = {
          tema: aiResult.tema,
          textoApoio1: aiResult.textoApoio1,
          textoApoio2: aiResult.textoApoio2
        };
      } catch (error) {
        console.error("Error calling Groq API:", error);
        
        // Em caso de erro, usar um tema aleatório da lista predefinida
        const temaSelecionado = temasPadroes[Math.floor(Math.random() * temasPadroes.length)];
        
        result = {
          tema: temaSelecionado,
          textoApoio1: "Texto de apoio relacionado ao tema. Este texto foi gerado automaticamente devido a um erro na API.",
          textoApoio2: "Texto de apoio adicional com outro ponto de vista sobre o tema proposto."
        };
      }
    }
    
    return NextResponse.json(result);
    
  } catch (error) {
    console.error("Error in /api/gerar-tema:", error);
    return NextResponse.json(
      { error: "Erro ao gerar tema", message: (error as Error).message },
      { status: 500 }
    );
  }
}
