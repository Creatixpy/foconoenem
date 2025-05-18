import { NextRequest, NextResponse } from "next/server";
import { isWithinOperatingHours, getOperatingHoursInfo } from "@/lib/schedule";

export async function POST(request: NextRequest) {
  try {
    // Verificar se o sistema está em horário de funcionamento
    if (!isWithinOperatingHours()) {
      const { message, opensAt, closesAt } = getOperatingHoursInfo();
      return NextResponse.json(
        {
          response: `Desculpe, nosso assistente está disponível apenas das ${opensAt} às ${closesAt}. ${message}`,
          offtopic: false
        },
        { status: 200 }
      );
    }

    const body = await request.json();
    const userMessage = body.message;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json(
        { error: "Mensagem inválida" },
        { status: 400 }
      );
    }

    // Verificar se a mensagem está relacionada a educação/ENEM
    const isEducationRelated = await checkIfEducationRelated(userMessage);
    
    if (!isEducationRelated) {
      return NextResponse.json({
        response: "Por favor, faça apenas perguntas relacionadas ao ENEM ou educação.",
        offtopic: true
      });
    }

    // Inicializar o cliente Groq com a API key
    const groqApiKey = process.env.GROQ_API_KEY;

    if (!groqApiKey) {
      console.error("Groq API key não encontrada");
      return NextResponse.json(
        { error: "Serviço temporariamente indisponível" },
        { status: 503 }
      );
    }

    const prompt = `
      Você é um assistente especializado em ENEM e educação brasileira. O usuário está te perguntando: "${userMessage}"
      
      Responda de forma clara, objetiva e útil, fornecendo informações precisas sobre o ENEM, vestibulares, 
      processos educacionais ou conteúdos acadêmicos.
      
      Se a pergunta não estiver relacionada à educação ou ao ENEM, ou se parecer off-topic, não responda e diga que 
      só pode falar sobre temas educacionais.
      
      Mantenha a resposta concisa, com no máximo 300 palavras.
    `;

    // Chamar API do Groq
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
        temperature: 0.5,
        max_tokens: 800
      })
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Erro na API Groq:", responseData);
      throw new Error(`Erro na API: ${responseData.error?.message || "Erro desconhecido"}`);
    }

    // Extrair a resposta
    const aiResponse = responseData.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta.";

    return NextResponse.json({
      response: aiResponse,
      offtopic: false
    });

  } catch (error) {
    console.error("Erro no chatbot:", error);
    return NextResponse.json(
      { error: "Erro ao processar sua pergunta" },
      { status: 500 }
    );
  }
}

// Função auxiliar para verificar se a pergunta está relacionada à educação/ENEM
async function checkIfEducationRelated(message: string): Promise<boolean> {
  try {
    // Lista de palavras-chave relacionadas a educação e ENEM
    const educationKeywords = [
      "enem", "vestibular", "faculdade", "universidade", "estudar", "estudo", 
      "matéria", "disciplina", "nota", "prova", "redação", "questão", "gabarito", 
      "simulado", "concurso", "professor", "ensino", "aluno", "educação", "colégio", 
      "escola", "aprender", "aprendizado", "conhecimento", "mec", "inep", "sisu", 
      "prouni", "fies", "bolsa", "pós-graduação", "mestrado", "doutorado", "phd", 
      "tcc", "monografia", "exame", "certificado", "diploma", "graduação", "licenciatura", 
      "bacharelado", "tecnólogo", "biologia", "química", "física", "matemática", 
      "história", "geografia", "filosofia", "sociologia", "português", "literatura", 
      "gramática", "inglês", "espanhol", "língua", "linguagem", "ciências", "humanas", 
      "exatas", "naturais"
    ];
    
    // Verificar se a mensagem contém palavras-chave de educação
    const messageLowerCase = message.toLowerCase();
    const containsEducationKeyword = educationKeywords.some(keyword => 
      messageLowerCase.includes(keyword)
    );
    
    // Se tiver pelo menos uma palavra-chave de educação, consideramos válido
    if (containsEducationKeyword) {
      return true;
    }
    
    // Para mensagens que não têm palavras-chave óbvias, podemos usar a IA para classificar
    // Aqui poderíamos fazer outra chamada à API para classificar, mas para simplificar
    // vamos apenas retornar com base nas palavras-chave
    
    return false;
  } catch (error) {
    console.error("Erro ao verificar relevância da pergunta:", error);
    // Em caso de erro, permitimos a pergunta para evitar falsos negativos
    return true;
  }
}
