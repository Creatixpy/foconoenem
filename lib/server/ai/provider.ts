import 'server-only';

import { withGroqRetry } from '@/lib/ai/retry';
import { MAX_PLAN_CODE, type UserSubscriptionSummary } from '@/lib/constants/subscriptions';
import { createAdminClient } from '@/lib/db/server';
import { generateWithNvidia, getNvidiaModel, type NvidiaMessage } from '@/lib/server/ai/nvidia';
import { getUserSubscription, hasMaxPlanAccess, toSubscriptionSummary } from '@/lib/server/subscriptions';

export type AiExecutorMessage = NvidiaMessage;

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

function createStandardRuntime(subscription: UserSubscriptionSummary): UserAiRuntime {
  return {
    subscription,
    async complete(request) {
      const { result, provider } = await withGroqRetry(request.label, async (currentProvider) => {
        const response = await currentProvider.client.chat.completions.create({
          model: currentProvider.model,
          messages: request.messages,
          temperature: request.temperature,
          max_completion_tokens: request.maxTokens,
          top_p: request.topP ?? 1,
          stream: false,
          ...(request.expectJson ? { response_format: { type: 'json_object' as const } } : {}),
        });

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
        tier: 'standard',
      };
    },
  };
}

function createMaxRuntime(subscription: UserSubscriptionSummary): UserAiRuntime {
  const standardFallback = createStandardRuntime(subscription);

  return {
    subscription,
    async complete(request) {
      try {
        const result = await generateWithNvidia(request.messages, {
          temperature: request.temperature,
          topP: request.topP ?? 1,
          maxTokens: request.maxTokens,
        });

        return {
          content: result.content,
          provider: 'nvidia',
          model: result.model,
          tier: 'max',
        };
      } catch (error) {
        const detail = error instanceof Error ? error.message : 'Falha desconhecida';
        console.warn('[Max AI] NVIDIA primary model failed; using standard fallback.', {
          model: getNvidiaModel(),
          detail,
        });

        const fallback = await standardFallback.complete(request);
        return {
          ...fallback,
          provider: `nvidia-fallback:${fallback.provider}`,
          tier: 'max',
        };
      }
    },
  };
}

export async function getUserAiRuntime(userId: string): Promise<UserAiRuntime> {
  const adminClient = createAdminClient();
  if (!adminClient) {
    throw new Error('Supabase service role não configurado.');
  }

  const subscriptionRow = await getUserSubscription(adminClient, userId);
  const subscription = toSubscriptionSummary(subscriptionRow);

  if (
    subscription.planCode === MAX_PLAN_CODE &&
    subscriptionRow &&
    hasMaxPlanAccess(subscriptionRow)
  ) {
    return createMaxRuntime(subscription);
  }

  return createStandardRuntime(subscription);
}
