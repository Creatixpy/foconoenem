import 'server-only';

import { withGroqRetry } from '@/lib/ai/retry';
import type { UserSubscriptionSummary } from '@/lib/constants/subscriptions';
import { createAdminClient } from '@/lib/db/server';
import { getUserSubscription, toSubscriptionSummary } from '@/lib/server/subscriptions';

export type AiExecutorMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AiCompletionRequest = {
  label: string;
  messages: AiExecutorMessage[];
  temperature: number;
  maxTokens: number;
  topP?: number;
  expectJson?: boolean;
};

export type AiCompletionResult = {
  content: string;
  provider: string;
  model: string;
  tier: 'standard' | 'max';
};

export type UserAiRuntime = {
  subscription: UserSubscriptionSummary;
  complete: (request: AiCompletionRequest) => Promise<AiCompletionResult>;
};

type CompletionResponse = {
  choices?: Array<{ message?: { content?: string | null } }>;
};

type CompletionClient = {
  chat: {
    completions: {
      create: (
        params: {
          model: string;
          messages: AiExecutorMessage[];
          temperature: number;
          max_completion_tokens: number;
          top_p: number;
          stream: false;
          response_format?: { type: 'json_object' };
        },
        options?: { timeout?: number }
      ) => Promise<CompletionResponse>;
    };
  };
};

function createGroqRuntime(
  subscription: UserSubscriptionSummary,
  tier: AiCompletionResult['tier']
): UserAiRuntime {
  return {
    subscription,
    async complete(request) {
      const { result, provider } = await withGroqRetry(request.label, async (currentProvider) => {
        const completionClient = currentProvider.client as unknown as CompletionClient;
        const response = await completionClient.chat.completions.create(
          {
            model: currentProvider.model,
            messages: request.messages,
            temperature: request.temperature,
            max_completion_tokens: request.maxTokens,
            top_p: request.topP ?? 1,
            stream: false,
            ...(request.expectJson ? { response_format: { type: 'json_object' as const } } : {}),
          }
        );

        const content = response.choices?.[0]?.message?.content?.trim() ?? '';
        if (!content) {
          throw new Error('A IA não retornou conteúdo.');
        }

        return {
          content,
          model: currentProvider.model,
        };
      });

      return {
        content: result.content,
        provider,
        model: result.model,
        tier,
      };
    },
  };
}

export async function getUserAiRuntime(userId: string): Promise<UserAiRuntime> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Supabase service role não configurado.');
  }

  const subscription = toSubscriptionSummary(await getUserSubscription(adminClient, userId));
  return createGroqRuntime(subscription, subscription.hasMaxAccess ? 'max' : 'standard');
}
