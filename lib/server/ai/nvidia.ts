import 'server-only';

import OpenAI from 'openai';

export type NvidiaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export const NVIDIA_PRIMARY_MODEL = 'minimaxai/minimax-m2.7';
const DEFAULT_NVIDIA_TIMEOUT_MS = 8_000;

let nvidiaClient: OpenAI | null = null;

function getNvidiaClient() {
  if (nvidiaClient) {
    return nvidiaClient;
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY não configurada.');
  }

  nvidiaClient = new OpenAI({
    apiKey,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  return nvidiaClient;
}

function getNvidiaTimeoutMs() {
  const parsed = Number(process.env.NVIDIA_MAX_TIMEOUT_MS ?? DEFAULT_NVIDIA_TIMEOUT_MS);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_NVIDIA_TIMEOUT_MS;
}

function withMiniMaxInstructions(messages: NvidiaMessage[]): NvidiaMessage[] {
  const instruction =
    'detailed thinking off\nReturn only the final answer in message.content. Do not return reasoning-only responses. When JSON is requested, return only valid JSON without markdown.';

  if (messages[0]?.role === 'system') {
    return [
      {
        ...messages[0],
        content: `${instruction}\n${messages[0].content}`,
      },
      ...messages.slice(1),
    ];
  }

  return [
    {
      role: 'system',
      content: instruction,
    },
    ...messages,
  ];
}

function extractTextContent(content: string | OpenAI.Chat.Completions.ChatCompletionContentPart[] | null) {
  if (typeof content === 'string') {
    return content.trim();
  }

  if (!Array.isArray(content)) {
    return '';
  }

  return content
    .map((part) => ('text' in part && typeof part.text === 'string' ? part.text : ''))
    .join('\n')
    .trim();
}

export async function generateWithNvidia(
  messages: NvidiaMessage[],
  options?: {
    temperature?: number;
    topP?: number;
    maxTokens?: number;
  }
) {
  const request = {
    model: NVIDIA_PRIMARY_MODEL,
    messages: withMiniMaxInstructions(messages),
    temperature: options?.temperature ?? 1,
    top_p: options?.topP ?? 1,
    max_tokens: options?.maxTokens ?? 8192,
    chat_template_kwargs: {
      enable_thinking: false,
    },
  } as const;

  const completion = await getNvidiaClient().chat.completions.create(request as never, {
    timeout: getNvidiaTimeoutMs(),
  });

  const message = completion.choices[0]?.message;
  const content = extractTextContent(message?.content ?? null);
  if (!content) {
    const reasoningContent = (message as { reasoning_content?: unknown } | undefined)?.reasoning_content;
    if (typeof reasoningContent === 'string' && reasoningContent.trim()) {
      throw new Error('A NVIDIA retornou raciocínio interno sem conteúdo final.');
    }

    throw new Error('A NVIDIA não retornou conteúdo.');
  }

  return {
    content,
    completion,
    model: NVIDIA_PRIMARY_MODEL,
  };
}

export function getNvidiaModel() {
  return NVIDIA_PRIMARY_MODEL;
}
