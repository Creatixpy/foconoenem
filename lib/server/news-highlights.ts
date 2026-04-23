import 'server-only';

import { revalidateTag } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { buildGroqProviders, GROQ_MAX_ATTEMPTS, isRateLimitError } from '@/lib/ai/groq';
import { logAdminAction } from '@/lib/admin-auth';
import { createAdminClient } from '@/lib/db/server';
import type { Database } from '@/types/supabase';

const GROQ_TIMEOUT_MS = 30_000;
const HIGHLIGHTS_LIMIT = 5;
const HIGHLIGHTS_REFRESH_HOURS = 24;
const MAX_NEWS_FOR_HIGHLIGHTS = 100;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LAST_HIGHLIGHTS_UPDATE_KEY = 'ultima_atualizacao_destaques';

type NoticiaResumo = {
  id: string;
  titulo: string;
  resumo: string | null;
  data: string | null;
  tags: string[] | null;
};

export type HighlightsStatus = {
  ultimaAtualizacao: string | null;
  proxima: string | null;
  status: 'never' | 'pending' | 'updated';
};

async function getLastUpdate(client: SupabaseClient<Database>) {
  const { data, error } = await client
    .from('configuracoes')
    .select('valor')
    .eq('chave', LAST_HIGHLIGHTS_UPDATE_KEY)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data?.valor) {
    return null;
  }

  const date = new Date(data.valor);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function getHighlightsCount(client: SupabaseClient<Database>) {
  const { count, error } = await client
    .from('noticias')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aprovado')
    .eq('destaque', true);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function updateLastRun(client: SupabaseClient<Database>) {
  const { error } = await client.from('configuracoes').upsert(
    {
      chave: LAST_HIGHLIGHTS_UPDATE_KEY,
      valor: new Date().toISOString(),
    },
    { onConflict: 'chave' }
  );

  if (error) {
    throw error;
  }
}

async function selectHighlightsWithGroq(noticias: NoticiaResumo[]) {
  const providers = buildGroqProviders();
  const attemptsLog: string[] = [];
  const prompt = `
Analise as seguintes notícias e selecione no máximo ${HIGHLIGHTS_LIMIT} para destaque na página inicial de um site educacional focado no ENEM.
Escolha notícias atuais e mais úteis para estudantes, considerando impacto educacional, relevância prática e interesse geral.

Notícias para análise:
${JSON.stringify(noticias)}

Responda APENAS em JSON:
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
            max_completion_tokens: 1200,
            top_p: 1,
            stream: false,
            response_format: { type: 'json_object' },
          },
          { signal: controller.signal }
        );

        clearTimeout(timeout);

        const content = response.choices?.[0]?.message?.content ?? '';
        const parsed = JSON.parse(content) as { destaques?: string[] };
        const destaques = (parsed.destaques ?? [])
          .filter((id): id is string => typeof id === 'string' && UUID_RE.test(id))
          .slice(0, HIGHLIGHTS_LIMIT);

        if (destaques.length === 0) {
          throw new Error('A IA não retornou notícias válidas para destaque.');
        }

        return {
          destaques,
          provider: provider.name,
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : String(error);
        attemptsLog.push(`[${provider.name}] tentativa ${attempt}: ${detail}`);
        console.error(`Erro ao selecionar destaques com ${provider.name}:`, error);

        if (isRateLimitError(error) && providerIndex < providers.length - 1) {
          break;
        }
      }
    }
  }

  throw new Error(attemptsLog.join(' | ') || 'Falha ao selecionar destaques.');
}

export async function getHighlightsStatus(client?: SupabaseClient<Database> | null): Promise<HighlightsStatus> {
  const resolvedClient = client ?? createAdminClient();
  if (!resolvedClient) {
    return {
      ultimaAtualizacao: null,
      proxima: null,
      status: 'never',
    };
  }

  try {
    const [lastUpdate, highlightsCount] = await Promise.all([
      getLastUpdate(resolvedClient),
      getHighlightsCount(resolvedClient),
    ]);

    if (!lastUpdate) {
      return {
        ultimaAtualizacao: null,
        proxima: null,
        status: 'never',
      };
    }

    const nextUpdate = new Date(lastUpdate.getTime() + HIGHLIGHTS_REFRESH_HOURS * 60 * 60 * 1000);
    const stale = Date.now() > nextUpdate.getTime();

    return {
      ultimaAtualizacao: lastUpdate.toISOString(),
      proxima: nextUpdate.toISOString(),
      status: stale || highlightsCount === 0 ? 'pending' : 'updated',
    };
  } catch (error) {
    console.error('Erro ao consultar status dos destaques:', error);
    return {
      ultimaAtualizacao: null,
      proxima: null,
      status: 'never',
    };
  }
}

async function shouldRefreshHighlights(client: SupabaseClient<Database>, force: boolean) {
  if (force) {
    return true;
  }

  const [lastUpdate, highlightsCount] = await Promise.all([
    getLastUpdate(client),
    getHighlightsCount(client),
  ]);

  if (highlightsCount === 0 || !lastUpdate) {
    return true;
  }

  return Date.now() - lastUpdate.getTime() >= HIGHLIGHTS_REFRESH_HOURS * 60 * 60 * 1000;
}

export async function refreshHighlights(options: {
  force?: boolean;
  adminEmail?: string | null;
  client?: SupabaseClient<Database> | null;
} = {}) {
  const { force = false, adminEmail = 'system', client } = options;
  const resolvedClient = client ?? createAdminClient();

  if (!resolvedClient) {
    return {
      refreshed: false,
      reason: 'admin_client_unavailable',
    };
  }

  const needsRefresh = await shouldRefreshHighlights(resolvedClient, force);
  if (!needsRefresh) {
    return {
      refreshed: false,
      reason: 'up_to_date',
    };
  }

  const limitDate = new Date();
  limitDate.setDate(limitDate.getDate() - 30);

  const { data: noticias, error } = await resolvedClient
    .from('noticias')
    .select('id, titulo, resumo, data_publicacao, tags')
    .eq('status', 'aprovado')
    .gte('data_publicacao', limitDate.toISOString())
    .order('data_publicacao', { ascending: false })
    .limit(MAX_NEWS_FOR_HIGHLIGHTS);

  if (error) {
    throw new Error(`Erro ao buscar notícias para destaque: ${error.message}`);
  }

  if (!noticias || noticias.length === 0) {
    return {
      refreshed: false,
      reason: 'no_approved_news',
    };
  }

  const { destaques, provider } = await selectHighlightsWithGroq(
    noticias.map((noticia) => ({
      id: noticia.id,
      titulo: noticia.titulo,
      resumo: noticia.resumo,
      data: noticia.data_publicacao,
      tags: noticia.tags,
    }))
  );

  const { error: clearError } = await resolvedClient
    .from('noticias')
    .update({ destaque: false })
    .eq('destaque', true);

  if (clearError) {
    throw new Error(`Erro ao limpar destaques anteriores: ${clearError.message}`);
  }

  const { error: updateError } = await resolvedClient
    .from('noticias')
    .update({ destaque: true })
    .in('id', destaques);

  if (updateError) {
    throw new Error(`Erro ao aplicar novos destaques: ${updateError.message}`);
  }

  await updateLastRun(resolvedClient);
  await logAdminAction(resolvedClient, {
    adminEmail,
    action: 'highlights_update',
    details: {
      provider,
      destaques,
      mode: force ? 'forced' : 'local_on_demand',
    },
  });
  revalidateTag('public-noticias', 'max');

  return {
    refreshed: true,
    highlights: destaques,
    provider,
  };
}

export async function refreshHighlightsIfDue() {
  try {
    return await refreshHighlights();
  } catch (error) {
    console.error('Erro ao atualizar destaques localmente:', error);
    return {
      refreshed: false,
      reason: 'refresh_failed',
    };
  }
}
