import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Função auxiliar para verificar se a última atualização foi há mais de 24 horas
async function isUpdateNeeded(): Promise<boolean> {
  try {
    // Buscar a última atualização de destaques
    const { data: configData, error: configError } = await supabase
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'ultima_atualizacao_destaques')
      .single();

    if (configError && configError.code !== 'PGRST116') { // PGRST116 = not found
      console.error("Erro ao buscar última atualização:", configError);
      return true; // Se houve erro, melhor atualizar
    }

    if (!configData) {
      return true; // Se não há registro de última atualização, deve atualizar
    }

    // Verificar se passaram 24 horas desde a última atualização
    const ultimaAtualizacao = new Date(configData.valor);
    const agora = new Date();
    const horasDesdeUltimaAtualizacao = (agora.getTime() - ultimaAtualizacao.getTime()) / (1000 * 60 * 60);

    return horasDesdeUltimaAtualizacao >= 24;
  } catch (error) {
    console.error("Erro ao verificar necessidade de atualização:", error);
    return true; // Em caso de erro, melhor atualizar
  }
}

// Função auxiliar para atualizar o timestamp da última atualização
async function atualizarTimestampAtualizacao(): Promise<void> {
  try {
    const agora = new Date().toISOString();
    
    // Verifica se o registro existe
    const { data: existeConfig } = await supabase
      .from('configuracoes')
      .select('chave')
      .eq('chave', 'ultima_atualizacao_destaques')
      .single();
    
    if (existeConfig) {
      // Atualiza o registro existente
      await supabase
        .from('configuracoes')
        .update({ valor: agora })
        .eq('chave', 'ultima_atualizacao_destaques');
    } else {
      // Cria um novo registro
      await supabase
        .from('configuracoes')
        .insert({ chave: 'ultima_atualizacao_destaques', valor: agora });
    }
  } catch (error) {
    console.error("Erro ao atualizar timestamp:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verificar se é uma atualização automática via cron job
    const isAutomaticUpdate = request.nextUrl.searchParams.get('automatic') === 'true';
    
    // Se for atualização automática, verifica se é necessário
    // Para atualizações manuais, sempre prossegue
    if (isAutomaticUpdate) {
      const precisaAtualizar = await isUpdateNeeded();
      
      if (!precisaAtualizar) {
        return NextResponse.json({
          status: "skipped",
          message: "Atualização de destaques não necessária. Menos de 24 horas desde a última atualização."
        });
      }
    }

    // 1. Buscar todas as notícias recentes (últimos 30 dias)
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - 30);
    
    const { data: noticias, error: noticiasError } = await supabase
      .from('noticias')
      .select('id, titulo, resumo, conteudo, data_publicacao, tags')
      .gte('data_publicacao', dataLimite.toISOString())
      .order('data_publicacao', { ascending: false });
    
    if (noticiasError) {
      throw new Error(`Erro ao buscar notícias: ${noticiasError.message}`);
    }

    if (!noticias || noticias.length === 0) {
      return NextResponse.json({
        status: "error",
        message: "Nenhuma notícia encontrada para análise"
      });
    }

    // 2. Analisar notícias com IA para selecionar destaques
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      throw new Error("Groq API key não encontrada");
    }

    // Preparar dados para enviar à IA
    const noticiasSimpificadas = noticias.map(n => ({
      id: n.id,
      titulo: n.titulo,
      resumo: n.resumo,
      data: n.data_publicacao,
      tags: n.tags
    }));

    // Enviar para a IA analisar
    const prompt = `
    Analise as seguintes notícias e selecione no máximo 5 para destaque na página inicial de um site educacional focado no ENEM.
    Escolha notícias que sejam mais relevantes para estudantes que estão se preparando para o ENEM, 
    considerando atualidade, impacto educacional e interesse geral.

    Notícias para análise:
    ${JSON.stringify(noticiasSimpificadas)}

    Responda APENAS em formato JSON com um array de IDs das notícias selecionadas (máximo 5):
    {
      "destaques": ["id1", "id2", "id3"]
    }`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "user", content: prompt }
        ],
        temperature: 0.3, // Baixa temperatura para decisões mais consistentes
        max_tokens: 500,
        response_format: { type: "json_object" }
      })
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error("Groq API error:", responseData);
      throw new Error(`Erro da API Groq: ${responseData.error?.message || "Erro desconhecido"}`);
    }

    // Extrair IDs das notícias selecionadas
    const aiContent = responseData.choices?.[0]?.message?.content || "";
    let aiResult;
    
    try {
      aiResult = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Erro ao fazer parse da resposta JSON:", parseError);
      
      // Tentar extrair JSON se estiver em formato de código
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) || 
                         aiContent.match(/(\{[\s\S]*\})/);
      
      if (!jsonMatch || !jsonMatch[1]) {
        throw new Error("Formato de resposta inválido da API");
      }
      
      aiResult = JSON.parse(jsonMatch[1].trim());
    }

    if (!aiResult.destaques || !Array.isArray(aiResult.destaques)) {
      throw new Error("Resposta da IA não contém array de destaques");
    }

    const idsDestaque = aiResult.destaques.slice(0, 5); // Garantir máximo de 5

    if (idsDestaque.length === 0) {
      throw new Error("IA não selecionou nenhuma notícia para destaque");
    }

    // 3. Resetar todos os destaques atuais
    const { error: resetError } = await supabase
      .from('noticias')
      .update({ destaque: false })
      .eq('destaque', true);
    
    if (resetError) {
      throw new Error(`Erro ao resetar destaques: ${resetError.message}`);
    }

    // 4. Definir as novas notícias como destaque
    const { error: updateError } = await supabase
      .from('noticias')
      .update({ destaque: true })
      .in('id', idsDestaque);
    
    if (updateError) {
      throw new Error(`Erro ao atualizar destaques: ${updateError.message}`);
    }

    // 5. Atualizar timestamp da última atualização
    await atualizarTimestampAtualizacao();

    return NextResponse.json({
      status: "success",
      message: "Destaques atualizados com sucesso",
      destaques: idsDestaque
    });

  } catch (error) {
    console.error("Erro na atualização automática de destaques:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar destaques", message: (error as Error).message },
      { status: 500 }
    );
  }
}
