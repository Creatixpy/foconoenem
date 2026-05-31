import 'server-only';

import Groq from "groq-sdk";
import { getDeepsProxyProvider } from '@/lib/ai/deepsproxy';
import type { OpenAiCompatibleClient } from '@/lib/ai/openai-compatible';

export type GroqProvider = {
  name: string;
  client: OpenAiCompatibleClient | Groq;
  model: string;
};

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const DEFAULT_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL ?? "llama3-70b-8192";
const parsedAttempts = Number(process.env.GROQ_MAX_ATTEMPTS ?? "2");
export const GROQ_MAX_ATTEMPTS = Number.isFinite(parsedAttempts) && parsedAttempts > 0 ? parsedAttempts : 2;

type BuildGroqProvidersOptions = {
  includeDeepsProxy?: boolean;
};

function createGroqProvider(apiKey: string | null | undefined, model: string, name: string): GroqProvider | null {
  if (!apiKey) {
    return null;
  }

  return {
    name,
    client: new Groq({ apiKey }),
    model,
  };
}

export async function buildGroqProviders(options: BuildGroqProvidersOptions = {}): Promise<GroqProvider[]> {
  const providers: GroqProvider[] = [];
  if (options.includeDeepsProxy !== false) {
    const deepsProxy = await getDeepsProxyProvider('deepsproxy', 'free');
    if (deepsProxy) {
      providers.push(deepsProxy);
    }
  }

  const primary = createGroqProvider(process.env.GROQ_API_KEY, DEFAULT_MODEL, "primary");
  if (!primary && providers.length === 0) {
    throw new Error("GROQ_API_KEY não configurada.");
  }
  if (primary) providers.push(primary);

  const fallback = createGroqProvider(process.env.GROQ_FALLBACK_API_KEY, DEFAULT_FALLBACK_MODEL, "fallback");
  if (fallback) {
    providers.push(fallback);
  }

  return providers;
}

export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;

  if (typeof error === "object" && error && "status" in error && (error as { status?: number }).status === 429) {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : JSON.stringify(error);

  return message.toLowerCase().includes("rate limit");
}
