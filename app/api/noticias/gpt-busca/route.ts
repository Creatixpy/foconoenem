import { NextRequest, NextResponse } from "next/server";
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, isRateLimitError } from "@/lib/ai/groq";

export async function POST(request: NextRequest) {
  try {
    const { termo } = await request.json();
    if (!termo) {
      return NextResponse.json({ error: "Termo de busca não fornecido" }, { status: 400 });
    }

    const providers = buildGroqProviders();
    const prompt = `Busque informações atualizadas e relevantes sobre: "${termo}" relacionado ao ENEM (Exame Nacional do Ensino Médio) no Brasil.

Forneça uma resposta completa incluindo:
- Notícias recentes e informações atualizadas
- Datas importantes e prazos (se aplicável)
- Informações do MEC/INEP quando relevante
- Dicas práticas para estudantes
- Orientações importantes

Seja claro, objetivo e use linguagem acessível para estudantes.`;

    const attemptsLog: string[] = [];

    for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
      const provider = providers[providerIndex];
      let attempt = 0;
      while (attempt < GROQ_MAX_ATTEMPTS) {
        attempt++;
        try {
          const completion = await provider.client.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: provider.model,
            temperature: 0.7,
            max_completion_tokens: 8192,
            top_p: 1,
            stream: false,
            reasoning_effort: "medium",
            stop: null,
            tools: [{ type: "browser_search" }],
          });

          const aiContent = completion.choices?.[0]?.message?.content?.trim() ?? "";
          if (!aiContent) {
            throw new Error("Resposta vazia da IA");
          }

          return NextResponse.json({
            noticias: aiContent,
            modelo: provider.model,
            provider: provider.name,
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
          console.error(`Erro na busca com IA (${provider.name}, tentativa ${attempt}):`, error);

          if (isRateLimitError(error) && providerIndex < providers.length - 1) {
            break;
          }
        }
      }
    }

    return NextResponse.json(
      {
        error: "Não foi possível gerar conteúdo",
        diagnostics: {
          stage: "gpt-busca",
          attempts: attemptsLog,
        },
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Erro na API de busca de notícias com IA:", error);
    const diagnostics =
      error && typeof error === "object" && "attemptsLog" in error
        ? ((error as { attemptsLog?: string[] }).attemptsLog ?? undefined)
        : undefined;

    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";

    return NextResponse.json(
      {
        error: "Erro ao processar a solicitação com busca na web.",
        details: errorMessage,
        diagnostics: diagnostics ? { stage: "gpt-busca", attempts: diagnostics } : undefined,
      },
      { status: 500 }
    );
  }
}
