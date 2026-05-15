import 'server-only';

import { createOpenAiCompatibleStreamingClient, type OpenAiCompatibleClient } from '@/lib/ai/openai-compatible';

const DEFAULT_CONFIG_URL_KEY = 'deepsproxy_public_url';
const DEFAULT_CONFIG_MODEL_KEY = 'deepsproxy_model';
const DEFAULT_CONFIG_FREE_MODEL_KEY = 'deepsproxy_free_model';
const DEFAULT_CONFIG_MAX_MODEL_KEY = 'deepsproxy_max_model';
const DEFAULT_MODEL = 'deepseek-thinking';
const CONFIG_CACHE_MS = 30_000;

export type DeepsProxyTier = 'free' | 'max';

type DeepsProxyConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

const cachedConfigs = new Map<string, { value: DeepsProxyConfig | null; expiresAt: number }>();

function normalizeBaseUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

async function readRuntimeConfig(keys: string[]): Promise<Record<string, string>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceKey || keys.length === 0) {
    return {};
  }

  const query = keys.map((key) => encodeURIComponent(key)).join(',');
  const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/configuracoes?select=chave,valor&chave=in.(${query})`;
  const response = await fetch(url, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Falha ao ler configuracoes do Supabase: ${response.status}`);
  }

  const rows = await response.json() as Array<{ chave?: unknown; valor?: unknown }>;
  return Object.fromEntries(
    rows
      .filter((row): row is { chave: string; valor: string } =>
        typeof row.chave === 'string' && typeof row.valor === 'string' && row.valor.trim().length > 0
      )
      .map((row) => [row.chave, row.valor.trim()])
  );
}

function tierModelKey(tier: DeepsProxyTier): string {
  if (tier === 'max') {
    return process.env.DEEPSPROXY_CONFIG_MAX_MODEL_KEY?.trim() || DEFAULT_CONFIG_MAX_MODEL_KEY;
  }

  return process.env.DEEPSPROXY_CONFIG_FREE_MODEL_KEY?.trim() || DEFAULT_CONFIG_FREE_MODEL_KEY;
}

function tierEnvModel(tier: DeepsProxyTier): string | undefined {
  if (tier === 'max') {
    return process.env.DEEPSPROXY_MAX_MODEL?.trim() || undefined;
  }

  return process.env.DEEPSPROXY_FREE_MODEL?.trim() || undefined;
}

export async function getDeepsProxyConfig(tier: DeepsProxyTier = 'free'): Promise<DeepsProxyConfig | null> {
  const apiKey = process.env.DEEPSPROXY_API_KEY?.trim();
  const urlKey = process.env.DEEPSPROXY_CONFIG_URL_KEY?.trim() || DEFAULT_CONFIG_URL_KEY;
  const legacyModelKey = process.env.DEEPSPROXY_CONFIG_MODEL_KEY?.trim() || DEFAULT_CONFIG_MODEL_KEY;
  const modelKey = tierModelKey(tier);
  const cacheKey = `${tier}:${urlKey}:${modelKey}:${legacyModelKey}`;
  const cachedConfig = cachedConfigs.get(cacheKey);

  if (cachedConfig && cachedConfig.expiresAt > Date.now()) {
    return cachedConfig.value;
  }

  if (!apiKey) {
    cachedConfigs.set(cacheKey, { value: null, expiresAt: Date.now() + CONFIG_CACHE_MS });
    return null;
  }

  const remoteConfig: Record<string, string> = await readRuntimeConfig(
    Array.from(new Set([urlKey, modelKey, legacyModelKey]))
  ).catch((error) => {
    console.warn('[DeepsProxy] Falha ao ler configuracao dinamica:', error);
    return {};
  });

  const baseUrl = process.env.DEEPSPROXY_BASE_URL?.trim() || remoteConfig[urlKey];
  if (!baseUrl) {
    cachedConfigs.set(cacheKey, { value: null, expiresAt: Date.now() + CONFIG_CACHE_MS });
    return null;
  }

  const model =
    tierEnvModel(tier) ||
    process.env.DEEPSPROXY_MODEL?.trim() ||
    remoteConfig[modelKey] ||
    remoteConfig[legacyModelKey] ||
    DEFAULT_MODEL;
  const value = {
    apiKey,
    baseUrl: normalizeBaseUrl(baseUrl),
    model,
  };

  cachedConfigs.set(cacheKey, { value, expiresAt: Date.now() + CONFIG_CACHE_MS });
  return value;
}

export async function getDeepsProxyProvider(name = 'deepsproxy', tier: DeepsProxyTier = 'free'): Promise<{
  name: string;
  client: OpenAiCompatibleClient;
  model: string;
} | null> {
  const config = await getDeepsProxyConfig(tier);
  if (!config) return null;

  return {
    name,
    client: createOpenAiCompatibleStreamingClient(config.baseUrl, config.apiKey),
    model: config.model,
  };
}
