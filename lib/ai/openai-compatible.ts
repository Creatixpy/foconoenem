import 'server-only';

export type OpenAiCompatibleMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAiCompatibleCompletionParams = {
  model: string;
  messages: OpenAiCompatibleMessage[];
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  response_format?: unknown;
  stream?: boolean;
};

export type OpenAiCompatibleCompletion = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export type OpenAiCompatibleClient = {
  chat: {
    completions: {
      create: (
        params: OpenAiCompatibleCompletionParams,
        options?: { signal?: AbortSignal; timeout?: number }
      ) => Promise<OpenAiCompatibleCompletion>;
    };
  };
};

const DEFAULT_REQUEST_TIMEOUT_MS = 90_000;

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/+$/, '');
  return trimmed.endsWith('/v1') ? trimmed : `${trimmed}/v1`;
}

function getDefaultTimeoutMs() {
  const parsed = Number(process.env.DEEPSPROXY_TIMEOUT_MS ?? DEFAULT_REQUEST_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_REQUEST_TIMEOUT_MS;
}

function timeoutSignal(timeoutMs: number | undefined, externalSignal?: AbortSignal) {
  if (!timeoutMs || externalSignal) return { signal: externalSignal, cleanup: () => undefined };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  return {
    signal: controller.signal,
    cleanup: () => clearTimeout(timeout),
  };
}

export function createOpenAiCompatibleStreamingClient(baseUrl: string, apiKey: string): OpenAiCompatibleClient {
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  return {
    chat: {
      completions: {
        async create(params, options) {
          const shouldStream = params.stream ?? false;
          const { signal, cleanup } = timeoutSignal(options?.timeout ?? getDefaultTimeoutMs(), options?.signal);

          try {
            const response = await fetch(`${normalizedBaseUrl}/chat/completions`, {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
              },
              signal,
              body: JSON.stringify({
                ...params,
                stream: shouldStream,
                max_tokens: params.max_tokens ?? params.max_completion_tokens,
              }),
            });

            if (!response.ok) {
              throw new Error(`OpenAI-compatible endpoint failed: ${response.status} ${await response.text().catch(() => '')}`);
            }

            if (!shouldStream) {
              return await response.json() as OpenAiCompatibleCompletion;
            }

            if (!response.body) {
              throw new Error('OpenAI-compatible endpoint did not return a response body.');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let content = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() ?? '';

              for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const raw = line.slice(6).trim();
                if (!raw || raw === '[DONE]') continue;

                const event = JSON.parse(raw);
                content += event.choices?.[0]?.delta?.content ?? '';
              }
            }

            return {
              choices: [
                {
                  message: {
                    content,
                  },
                },
              ],
            };
          } finally {
            cleanup();
          }
        },
      },
    },
  };
}
