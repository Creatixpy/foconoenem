import { NextRequest, NextResponse } from 'next/server';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, isRateLimitError } from '@/lib/ai/groq';
import { searchNoticias as searchNoticiasAprovadas } from '@/lib/server/noticias';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

const MAX_CONTEXT_ARTICLES = 6;

type SearchArticle = Awaited<ReturnType<typeof searchNoticiasAprovadas>>[number];

function stripHtml(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatArticleForPrompt(article: SearchArticle): string {
  const publicationDate = new Date(article.data_publicacao).toLocaleDateString('pt-BR');
  const summary = stripHtml(article.resumo).slice(0, 280);
  const content = stripHtml(article.conteudo).slice(0, 500);

  return [
    `Título: ${article.titulo}`,
    `Data: ${publicationDate}`,
    article.fonte_url ? `Fonte: ${article.fonte_url}` : 'Fonte: não informada',
    summary ? `Resumo: ${summary}` : null,
    content ? `Trecho: ${content}` : null,
  ]
    .filter(Boolean)
    .join('\n');
}

async function loadArticlesForQuery(query: string): Promise<SearchArticle[]> {
  return searchNoticiasAprovadas(query, MAX_CONTEXT_ARTICLES);
}

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateResult = await checkRateLimit(ip, '/api/noticias/gpt-busca', 5, 1);

    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas requisições',
          message: `Limite de buscas atingido. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const { termo } = await request.json();
    if (!termo || typeof termo !== 'string') {
      return NextResponse.json({ error: 'Termo de busca não fornecido' }, { status: 400 });
    }

    const sanitizedTermo = termo.trim().slice(0, 200);
    if (sanitizedTermo.length < 2) {
      return NextResponse.json({ error: 'Termo de busca muito curto' }, { status: 400 });
    }

    const articles = await loadArticlesForQuery(sanitizedTermo);
    if (articles.length === 0) {
      return NextResponse.json(
        {
          error: 'Nenhuma notícia aprovada encontrada para esse tema no momento.',
        },
        { status: 404 }
      );
    }

    const articleContext = articles.map(formatArticleForPrompt).join('\n\n---\n\n');

    let providers: Awaited<ReturnType<typeof buildGroqProviders>>;
    try {
      providers = await buildGroqProviders();
    } catch {
      return NextResponse.json(
        {
          error: 'Serviço de IA indisponível no momento.',
        },
        { status: 503 }
      );
    }

    const prompt = `Você é um assistente da AprovIA.

Use exclusivamente as notícias fornecidas abaixo para responder à pergunta do usuário.
Não invente fatos, não diga que pesquisou na web e não mencione fontes que não estejam no contexto.
Quando citar informação temporal, mencione datas concretas em formato brasileiro.
Se as notícias não forem suficientes para responder tudo, diga isso explicitamente.

Pergunta do usuário: "${sanitizedTermo}"

Notícias disponíveis:
${articleContext}

Responda em português do Brasil, com linguagem clara para estudantes, em até 6 parágrafos curtos.`;

    const attemptsLog: string[] = [];

    for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
      const provider = providers[providerIndex];
      let attempt = 0;

      while (attempt < GROQ_MAX_ATTEMPTS) {
        attempt++;
        try {
          const completion = await provider.client.chat.completions.create({
            messages: [{ role: 'user', content: prompt }],
            model: provider.model,
            temperature: 0.3,
            max_completion_tokens: 2048,
            top_p: 1,
            stream: false,
          });

          const aiContent = completion.choices?.[0]?.message?.content?.trim() ?? '';
          if (!aiContent) {
            throw new Error('Resposta vazia da IA');
          }

          return NextResponse.json({
            noticias: aiContent,
            modelo: provider.model,
            provider: provider.name,
            fontes: articles.map((article) => ({
              titulo: article.titulo,
              slug: article.slug,
              data_publicacao: article.data_publicacao,
              fonte_url: article.fonte_url,
            })),
          });
        } catch (error) {
          const detail = error instanceof Error ? error.message : String(error);
          attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
          console.error(`Erro na síntese de notícias com IA (${provider.name}, tentativa ${attempt}):`, error);

          if (isRateLimitError(error) && providerIndex < providers.length - 1) {
            break;
          }
        }
      }
    }

    return NextResponse.json(
      {
        error: 'Não foi possível gerar o resumo das notícias agora.',
      },
      { status: 503 }
    );
  } catch (error) {
    console.error('Erro na API de busca de notícias com IA:', error);

    return NextResponse.json(
      {
        error: 'Erro ao processar a solicitação de resumo de notícias.',
      },
      { status: 500 }
    );
  }
}
