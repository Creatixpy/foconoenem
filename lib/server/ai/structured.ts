import 'server-only';

import type { z } from 'zod';
import type { UserAiRuntime } from '@/lib/server/ai/provider';

type StructuredCompletionInput<TSchema extends z.ZodType> = {
  runtime: UserAiRuntime;
  schema: TSchema;
  label: string;
  system: string;
  user: string;
  temperature: number;
  maxTokens: number;
};

export async function requestStructuredCompletion<TSchema extends z.ZodType>(
  input: StructuredCompletionInput<TSchema>
): Promise<{ data: z.infer<TSchema>; provider: string; model: string }> {
  let validationError = 'schema inválido';

  for (let validationAttempt = 0; validationAttempt < 2; validationAttempt += 1) {
    let response;
    try {
      response = await input.runtime.complete({
        label: `${input.label}:validation-${validationAttempt + 1}`,
        messages: [
          { role: 'system', content: input.system },
          { role: 'user', content: input.user },
        ],
        temperature: input.temperature,
        maxTokens: input.maxTokens,
        topP: 1,
        expectJson: true,
        maxAttempts: 1,
        providerOffset: validationAttempt,
      });
    } catch (error) {
      const retryable =
        error instanceof Error &&
        'retryable' in error &&
        (error as Error & { retryable?: boolean }).retryable === true;
      if (!retryable || validationAttempt === 1) throw error;
      validationError = 'falha transitória do provedor';
      continue;
    }

    const validation = parseStructuredJson(input.schema, response.content);
    if (validation.success) {
      return {
        data: validation.data,
        provider: response.provider,
        model: response.model,
      };
    }

    validationError = validation.error;
  }

  throw new Error(`A IA retornou dados inválidos: ${validationError}`);
}

export function parseStructuredJson<TSchema extends z.ZodType>(
  schema: TSchema,
  content: string
): { success: true; data: z.infer<TSchema> } | { success: false; error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { success: false, error: 'JSON inválido' };
  }

  const validation = schema.safeParse(parsed);
  return validation.success
    ? { success: true, data: validation.data }
    : { success: false, error: validation.error.issues[0]?.message ?? 'schema inválido' };
}
