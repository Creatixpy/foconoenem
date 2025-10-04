import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

export async function POST(request: NextRequest) {
  try {
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Serviço de busca com IA indisponível. API key não configurada.' },
        { status: 503 }
      );
    }

    const { termo } = await request.json();
    
    if (!termo) {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }

    // Inicializar o cliente Groq
    const groq = new Groq({ apiKey: groqApiKey });
    
    // Prompt para buscar notícias atualizadas sobre ENEM
    const prompt = `Busque informações atualizadas e relevantes sobre: "${termo}" relacionado ao ENEM (Exame Nacional do Ensino Médio) no Brasil.

Forneça uma resposta completa incluindo:
- Notícias recentes e informações atualizadas
- Datas importantes e prazos (se aplicável)
- Informações do MEC/INEP quando relevante
- Dicas práticas para estudantes
- Orientações importantes

Seja claro, objetivo e use linguagem acessível para estudantes.`;

    // Usar o modelo GPT OSS com browser_search como built-in tool
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      max_completion_tokens: 8192,
      top_p: 1,
      stream: true,
      reasoning_effort: "medium",
      stop: null,
      tools: [
        {
          type: "browser_search"
        }
      ]
    });

    // Coletar o conteúdo do stream
    let aiContent = "";
    
    for await (const chunk of chatCompletion) {
      const content = chunk.choices?.[0]?.delta?.content || '';
      aiContent += content;
    }
    
    if (!aiContent || aiContent.trim().length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível gerar conteúdo' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      noticias: aiContent,
      modelo: "GPT OSS 120B com Browser Search"
    });
    
  } catch (error) {
    console.error('Erro na API de busca de notícias com IA:', error);
    
    // Tratamento de erro mais específico
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    
    return NextResponse.json({ 
      error: 'Erro ao processar a solicitação com busca na web.',
      details: errorMessage
    }, { status: 500 });
  }
}