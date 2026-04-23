import 'server-only';

import OpenAI from 'openai';

export type NvidiaMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

const NVIDIA_MODEL = 'z-ai/glm-5.1';

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
    model: NVIDIA_MODEL,
    messages,
    temperature: options?.temperature ?? 1,
    top_p: options?.topP ?? 1,
    max_tokens: options?.maxTokens ?? 8192,
    chat_template_kwargs: {
      enable_thinking: true,
      clear_thinking: false,
    },
  } as const;

  const completion = await getNvidiaClient().chat.completions.create(request as never);

  const content = extractTextContent(completion.choices[0]?.message?.content ?? null);
  if (!content) {
    throw new Error('A NVIDIA não retornou conteúdo.');
  }

  return {
    content,
    completion,
    model: NVIDIA_MODEL,
  };
}

export function getNvidiaModel() {
  return NVIDIA_MODEL;
}
