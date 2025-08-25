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
    
    // Prompt para buscar notícias sobre ENEM
    const prompt = `Você é um assistente especializado em buscar notícias sobre o ENEM (Exame Nacional do Ensino Médio) no Brasil. 
    Busque notícias recentes e relevantes sobre o tema: "${termo}".
    
    Foque em informações como:
    - Alterações no edital ou datas
    - Notícias sobre o Ministério da Educação (MEC)
    - Informações sobre inscrições
    - Dicas e orientações para os estudantes
    - Estatísticas e dados importantes
    
    Use a ferramenta de busca para encontrar informações atualizadas e relevantes.`;

    // Chamar o GPT OSS com a tool de browser_search
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      model: "openai/gpt-oss-120b",
      temperature: 0.7,
      max_completion_tokens: 8000,
      top_p: 1,
      stream: false,
      tools: [
        {
          type: "browser_search"
        }
      ]
    });

    // Extrair o conteúdo da resposta
    const aiContent = chatCompletion.choices?.[0]?.message?.content || "";
    
    return NextResponse.json({ 
      noticias: aiContent,
      modelo: "GPT OSS com Browser Search" 
    });
    
  } catch (error) {
    console.error('Erro na API de busca de notícias com GPT OSS:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}