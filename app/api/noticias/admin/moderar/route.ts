import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin, logAdminAction } from "@/lib/admin-auth";
import { createAdminClient } from '@/lib/db/server';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, GroqProvider, isRateLimitError } from "@/lib/ai/groq";

const MAX_NEWS_TO_REVIEW = 25;
const GROQ_TIMEOUT_MS = 30_000;

type ModerationDecision = "RELEVANTE" | "IRRELEVANTE";

function buildPrompt({
  titulo,
  resumo,
  conteudo,
  tags,
}: {
  titulo: string;
  resumo?: string | null;
  conteudo?: string | null;
  tags?: string[] | null;
}) {
  const trimmedResumo = (resumo ?? "").slice(0, 600);
  const trimmedConteudo = (conteudo ?? "").slice(0, 1500);
  const tagsText = tags && tags.length > 0 ? `Tags: ${tags.join(", ")}` : "Tags: (sem tags)";

  return `Título: ${titulo}\n${tagsText}\nResumo: ${trimmedResumo || "(sem resumo)"}\nConteúdo: ${
    trimmedConteudo || "(sem conteúdo)"
  }\n---\nA notícia acima é claramente relacionada a educação, vestibulares, ENEM ou políticas educacionais? Responda apenas com RELEVANTE ou IRRELEVANTE.`;
}

export async function POST(request: NextRequest) {
  const authResult = await authorizeAdmin(request);

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
      { status: authResult.status ?? 401 }
    );
  }

  const supabaseAdmin = createAdminClient();

  if (!supabaseAdmin) {
    return NextResponse.json(
      { error: "Serviço indisponível." },
      { status: 500 }
    );
  }

  let groqProviders: GroqProvider[];
  try {
    groqProviders = buildGroqProviders();
  } catch {
    return NextResponse.json({ error: "Serviço de IA indisponível." }, { status: 503 });
  }

  // Only moderate articles with 'pendente' status
  const { data: noticias, error } = await supabaseAdmin
    .from("noticias")
    .select("id, titulo, resumo, conteudo, tags")
    .eq("status", "pendente")
    .order("created_at", { ascending: false })
    .limit(MAX_NEWS_TO_REVIEW);

  if (error) {
    console.error("Erro ao buscar notícias para moderação:", error);
    return NextResponse.json({ error: "Falha ao buscar notícias." }, { status: 500 });
  }

  if (!noticias || noticias.length === 0) {
    return NextResponse.json({
      reviewed: 0,
      approved: 0,
      rejected: 0,
      message: "Nenhuma notícia pendente para analisar.",
    });
  }

  const idsAprovados: string[] = [];
  const idsRejeitados: string[] = [];
  const decisions: Array<{ id: string; decision: ModerationDecision }> = [];
  const diagnostics: string[] = [];
  const providerUsage: Record<string, number> = {};

  for (const noticia of noticias) {
    if (!noticia?.id || !noticia?.titulo) {
      continue;
    }

    const result = await moderateNoticiaWithProviders(noticia, groqProviders);
    diagnostics.push(...result.attempts);

    if (result.provider) {
      providerUsage[result.provider] = (providerUsage[result.provider] ?? 0) + 1;
    }

    decisions.push({ id: noticia.id, decision: result.decision });

    if (result.decision === "IRRELEVANTE") {
      idsRejeitados.push(noticia.id);
    } else {
      idsAprovados.push(noticia.id);
    }
  }

  // Soft-update: set status instead of deleting
  if (idsRejeitados.length > 0) {
    const { error: rejectError } = await supabaseAdmin
      .from("noticias")
      .update({ status: "rejeitado" })
      .in("id", idsRejeitados);

    if (rejectError) {
      console.error("Erro ao rejeitar notícias:", rejectError);
    }
  }

  if (idsAprovados.length > 0) {
    const { error: approveError } = await supabaseAdmin
      .from("noticias")
      .update({ status: "aprovado" })
      .in("id", idsAprovados);

    if (approveError) {
      console.error("Erro ao aprovar notícias:", approveError);
    }
  }

  const adminEmail = authResult.mode === 'user' ? authResult.user?.email ?? null : 'cron';
  await logAdminAction(supabaseAdmin, {
    adminEmail,
    action: 'news_moderate',
    details: {
      reviewed: decisions.length,
      approved: idsAprovados.length,
      rejected: idsRejeitados.length,
    },
  });

  return NextResponse.json({
    reviewed: decisions.length,
    approved: idsAprovados.length,
    rejected: idsRejeitados.length,
    providersUsed: providerUsage,
    diagnostics: diagnostics.length > 0 ? diagnostics : undefined,
  });
}

async function moderateNoticiaWithProviders(
  noticia: {
    id: string;
    titulo: string;
    resumo?: string | null;
    conteudo?: string | null;
    tags?: string[] | null;
  },
  providers: GroqProvider[]
): Promise<{ decision: ModerationDecision; provider?: string; attempts: string[] }> {
  const attempts: string[] = [];

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

        const completion = await provider.client.chat.completions.create(
          {
            model: provider.model,
            temperature: 0,
            max_completion_tokens: 64,
            messages: [
              {
                role: "system",
                content:
                  "Você é um moderador rígido. Responda exclusivamente com 'RELEVANTE' se a notícia fala sobre educação, ENEM, vestibulares, escolas, políticas educacionais ou orientações para estudantes. Responda 'IRRELEVANTE' para qualquer outro assunto.",
              },
              {
                role: "user",
                content: buildPrompt(noticia),
              },
            ],
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        const answer = completion.choices?.[0]?.message?.content?.trim().toUpperCase() as ModerationDecision | undefined;
        const decision: ModerationDecision = answer === "IRRELEVANTE" ? "IRRELEVANTE" : "RELEVANTE";

        return { decision, provider: provider.name, attempts };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        const attemptLog = `[${noticia.id}] (${provider.name}) tentativa ${attempt}: ${detail}`;
        attempts.push(attemptLog);
        console.error(`Erro ao analisar notícia ${noticia.id} com ${provider.name} (tentativa ${attempt}):`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  return { decision: "RELEVANTE", attempts };
}
