import { NextRequest, NextResponse } from "next/server";
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, isRateLimitError } from "@/lib/ai/groq";
import { checkRateLimit } from "@/lib/server/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // C03: Add rate limiting to prevent AI cost abuse
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0].trim() ?? request.headers.get("x-real-ip") ?? "unknown";
    const rateResult = await checkRateLimit(ip, "/api/noticias/gpt-busca", 5, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: "Muitas requisições",
          message: `Limite de buscas atingido. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const { termo } = await request.json();
    if (!termo || typeof termo !== 'string') {
      return NextResponse.json({ error: "Termo de busca não fornecido" }, { status: 400 });
    }

    // Validate search term length
    const sanitizedTermo = termo.trim().slice(0, 200);
    if (sanitizedTermo.length < 2) {
      return NextResponse.json({ error: "Termo de busca muito curto" }, { status: 400 });
    }

    const providers = buildGroqProviders();
    const prompt = `Busque informações atualizadas e relevantes sobre: "${sanitizedTermo}" relacionado ao ENEM (Exame Nacional do Ensino Médio) no Brasil.

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
      },
      { status: 503 }
    );
  } catch (error) {
    console.error("Erro na API de busca de notícias com IA:", error);

    return NextResponse.json(
      {
        error: "Erro ao processar a solicitação com busca na web.",
      },
      { status: 500 }
    );
  }
}
