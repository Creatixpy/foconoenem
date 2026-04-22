import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, logAdminAction } from '@/lib/admin-auth';
import { type SupabaseClient, type Database } from '@/lib/db';
import { createAdminClient } from '@/lib/db/server';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, isRateLimitError } from '@/lib/ai/groq';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

const GROQ_TIMEOUT_MS = 30_000;
const MAX_NEWS_FOR_HIGHLIGHTS = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type NoticiaResumo = {
  id: string;
  titulo: string;
  resumo: string | null;
  data: string | null;
  tags: string[] | null;
};

async function isUpdateNeeded(client: SupabaseClient<Database> | null) {
  if (!client) return false;

  try {
    const { data, error } = await client
      .from('configuracoes')
      .select('valor')
      .eq('chave', 'ultima_atualizacao_destaques')
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('Erro ao consultar ultima_atualizacao_destaques:', error);
      return true;
    }

    if (!data?.valor) {
      return true;
    }

    const ultima = new Date(data.valor);
    if (Number.isNaN(ultima.getTime())) {
      return true;
    }

    const horas = (Date.now() - ultima.getTime()) / (1000 * 60 * 60);
    return horas >= 24;
  } catch (error) {
    console.error('Erro ao verificar necessidade de atualização:', error);
    return true;
  }
}

async function atualizarTimestamp(client: SupabaseClient<Database> | null) {
  if (!client) return;

  try {
    const agora = new Date().toISOString();
    const { data } = await client
      .from('configuracoes')
      .select('id')
      .eq('chave', 'ultima_atualizacao_destaques')
      .maybeSingle();

    if (data?.id) {
      await client.from('configuracoes').update({ valor: agora }).eq('id', data.id);
    } else {
      await client.from('configuracoes').insert({ chave: 'ultima_atualizacao_destaques', valor: agora });
    }
  } catch (error) {
    console.error('Erro ao atualizar timestamp de destaques:', error);
  }
}

async function selectHighlightsWithGroq(noticias: NoticiaResumo[]) {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];
  const prompt = `
  Analise as seguintes notícias e selecione no máximo 5 para destaque na página inicial de um site educacional focado no ENEM.
  Escolha notícias que sejam mais relevantes para estudantes que estão se preparando para o ENEM,
  considerando atualidade, impacto educacional e interesse geral.

  Notícias para análise:
  ${JSON.stringify(noticias)}

  Responda APENAS em formato JSON com um array de IDs das notícias selecionadas (máximo 5):
  {
    "destaques": ["id1", "id2", "id3"]
  }`;

  for (let providerIndex = 0; providerIndex < providers.length; providerIndex++) {
    const provider = providers[providerIndex];
    let attempt = 0;

    while (attempt < GROQ_MAX_ATTEMPTS) {
      attempt++;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

        const response = await provider.client.chat.completions.create(
          {
            messages: [{ role: 'user', content: prompt }],
            model: provider.model,
            temperature: 0.3,
            max_tokens: 8050,
            top_p: 1,
            stream: false,
            response_format: { type: 'json_object' },
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        const content = response.choices?.[0]?.message?.content ?? '';
        let parsed: { destaques?: string[] };

        try {
          parsed = JSON.parse(content);
        } catch (parseError) {
          console.error('Falha ao parsear JSON diretamente:', parseError);
          const match =
            content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
            content.match(/(\{[\s\S]*\})/);
          if (!match?.[1]) {
            throw new Error('Formato de resposta inválido da API.');
          }
          parsed = JSON.parse(match[1].trim());
        }

        if (!parsed.destaques || !Array.isArray(parsed.destaques)) {
          throw new Error('Resposta da IA não contém array de destaques.');
        }

        const destaques = parsed.destaques
          .filter((id: string) => typeof id === 'string' && UUID_RE.test(id))
          .slice(0, 5);
        if (destaques.length === 0) {
          throw new Error('IA não selecionou nenhuma notícia válida.');
        }

        return { destaques, provider: provider.name };
      } catch (error) {
        const detail =
          error instanceof Error
            ? error.message
            : typeof error === 'string'
              ? error
              : JSON.stringify(error);
        attemptsLog.push(`(${provider.name}) tentativa ${attempt}: ${detail}`);
        console.error(`Erro ao selecionar destaques com ${provider.name} (tentativa ${attempt}):`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  const finalError = new Error(attemptsLog.join(' | ') || 'Falha ao selecionar destaques');
  (finalError as Error & { attemptsLog?: string[] }).attemptsLog = attemptsLog;
  throw finalError;
}

async function processAutomaticUpdate(
  client: SupabaseClient<Database> | null,
  adminEmail: string | null = 'cron'
) {
  if (!client) {
    throw new Error('Supabase service role não configurado.');
  }

  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 30);

  const { data: noticias, error: noticiasError } = await client
    .from('noticias')
    .select('id, titulo, resumo, conteudo, data_publicacao, tags')
    .eq('status', 'aprovado')
    .gte('data_publicacao', limitDate.toISOString())
    .order('data_publicacao', { ascending: false })
    .limit(MAX_NEWS_FOR_HIGHLIGHTS);

  if (noticiasError) {
    throw new Error(`Erro ao buscar notícias: ${noticiasError.message}`);
  }

  if (!noticias || noticias.length === 0) {
    return {
      status: 'error' as const,
      message: 'Nenhuma notícia encontrada para análise',
    };
  }

  const simplificadas: NoticiaResumo[] = noticias.map((noticia) => ({
    id: noticia.id,
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    data: noticia.data_publicacao,
    tags: noticia.tags,
  }));

  const { destaques, provider } = await selectHighlightsWithGroq(simplificadas);

  const { error: resetError } = await client.from('noticias').update({ destaque: false }).eq('destaque', true);
  if (resetError) {
    throw new Error(`Erro ao resetar destaques: ${resetError.message}`);
  }

  const { error: updateError } = await client.from('noticias').update({ destaque: true }).in('id', destaques);
  if (updateError) {
    throw new Error(`Erro ao atualizar destaques: ${updateError.message}`);
  }

  await atualizarTimestamp(client);

  await logAdminAction(client, {
    adminEmail,
    action: 'highlights_update',
    details: { destaques, provider },
  });

  return {
    status: 'success' as const,
    message: 'Destaques atualizados com sucesso',
    destaques,
    provider,
  };
}

export async function GET(request: NextRequest) {
  const isAutomatic = request.nextUrl.searchParams.get('automatic') === 'true';
  if (!isAutomatic) {
    return NextResponse.json(
      { error: 'Method not allowed. Use POST para execução manual.' },
      { status: 405 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  const auth = await authorizeAdmin(request, { allowCron: true });

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message ?? 'Acesso negado' },
      { status: auth.status ?? 401 }
    );
  }

  if (auth.mode !== 'cron') {
    return NextResponse.json(
      { error: 'Método reservado para execução automática.' },
      { status: 405 }
    );
  }

  const precisaAtualizar = await isUpdateNeeded(supabase);
  if (!precisaAtualizar) {
    return NextResponse.json({
      status: 'skipped',
      message: 'Atualização de destaques não necessária. Menos de 24 horas desde a última atualização.',
    });
  }

  try {
    const resultado = await processAutomaticUpdate(supabase, 'cron');
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao atualizar destaques:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar destaques.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request, { allowMissingOriginForAuthHeader: true });
  if (originError) {
    return originError;
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  const auth = await authorizeAdmin(request, { allowCron: true });
  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.message ?? 'Acesso negado' },
      { status: auth.status ?? 401 }
    );
  }

  try {
    const adminEmail = auth.mode === 'user' ? auth.user?.email ?? null : 'cron';
    const resultado = await processAutomaticUpdate(supabase, adminEmail);
    return NextResponse.json(resultado);
  } catch (error) {
    console.error('Erro ao atualizar destaques:', error);
    return NextResponse.json(
      {
        error: 'Erro ao atualizar destaques.',
      },
      { status: 500 }
    );
  }
}
