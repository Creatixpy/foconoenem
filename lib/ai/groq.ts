import 'server-only';

import Groq from "groq-sdk";

export type GroqProvider = {
  name: string;
  client: Groq;
  model: string;
};

const DEFAULT_MODEL = process.env.GROQ_MODEL ?? "openai/gpt-oss-120b";
const DEFAULT_FALLBACK_MODEL = process.env.GROQ_FALLBACK_MODEL ?? "llama3-70b-8192";
const parsedAttempts = Number(process.env.GROQ_MAX_ATTEMPTS ?? "2");
export const GROQ_MAX_ATTEMPTS = Number.isFinite(parsedAttempts) && parsedAttempts > 0 ? parsedAttempts : 2;

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

export async function buildGroqProviders(): Promise<GroqProvider[]> {
  const providers: GroqProvider[] = [];

  const primary = createGroqProvider(process.env.GROQ_API_KEY, DEFAULT_MODEL, "primary");
  if (!primary) {
    throw new Error("GROQ_API_KEY não configurada.");
  }
  providers.push(primary);

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
