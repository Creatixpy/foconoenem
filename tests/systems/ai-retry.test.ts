import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import type { GroqProvider } from '../../lib/ai/groq';
import type { UserAiRuntime } from '../../lib/server/ai/provider';

const buildProviders = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('@/lib/ai/groq', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../lib/ai/groq')>(),
  buildGroqProviders: buildProviders,
}));

import { isRetryableGroqError } from '../../lib/ai/groq';
import { withGroqRetry } from '../../lib/ai/retry';
import { requestStructuredCompletion } from '../../lib/server/ai/structured';

const providers = [
  { name: 'primary', model: 'primary-model', client: {} },
  { name: 'fallback', model: 'fallback-model', client: {} },
] as GroqProvider[];

function generationError() {
  return Object.assign(new Error('Failed to generate JSON.'), {
    status: 400,
    error: { error: { code: 'json_validate_failed', type: 'invalid_request_error' } },
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  buildProviders.mockResolvedValue(providers);
});
afterEach(() => vi.restoreAllMocks());

describe('falhas de geração JSON do provedor', () => {
  it.each([
    { status: 400, error: { error: { code: 'json_validate_failed' } } },
    { status: 400, error: { code: 'json_validate_failed' } },
  ])('reconhece o erro estruturado de geração sem depender da mensagem: %j', (error) => {
    expect(isRetryableGroqError(error)).toBe(true);
  });

  it('não repete erros de configuração, autenticação ou outros códigos 400', () => {
    for (const error of [
      { status: 400, error: { error: { code: 'invalid_request_error' } } },
      { status: 400, message: 'json_validate_failed' },
      { status: 401, error: { error: { code: 'invalid_api_key' } } },
    ]) expect(isRetryableGroqError(error)).toBe(false);
  });

  it.each([false, true])('usa o fallback dentro de duas chamadas totais; falha repetida: %s', async (repeatFailure) => {
    const generate = vi.fn().mockRejectedValueOnce(generationError());
    if (repeatFailure) generate.mockRejectedValueOnce(generationError());
    else generate.mockResolvedValueOnce('{"value":"resposta válida"}');

    const complete = vi.fn<UserAiRuntime['complete']>(async (request) => {
      const { result, provider } = await withGroqRetry(request.label, generate, {
        maxAttempts: request.maxAttempts,
        providerOffset: request.providerOffset,
      });
      return { content: result, provider, model: 'test-model', tier: 'standard' };
    });
    const runtime = { complete, subscription: {} } as UserAiRuntime;
    const result = requestStructuredCompletion({
      runtime,
      schema: z.object({ value: z.string() }),
      label: 'regression-json',
      system: 'Responda JSON válido.',
      user: 'Gere uma resposta.',
      temperature: 0,
      maxTokens: 100,
    });

    if (repeatFailure) await expect(result).rejects.toThrow('Failed to generate JSON');
    else await expect(result).resolves.toMatchObject({ data: { value: 'resposta válida' }, provider: 'fallback' });

    expect(complete).toHaveBeenCalledTimes(2);
    expect(generate).toHaveBeenCalledTimes(2);
    expect(generate.mock.calls.map(([provider]) => provider.name)).toEqual(['primary', 'fallback']);
    expect(complete.mock.calls.every(([request]) => request.maxAttempts === 1)).toBe(true);
  });

  it('interrompe uma resposta 400 comum sem consumir o fallback', async () => {
    const generate = vi.fn().mockRejectedValue(Object.assign(new Error('Unsupported model parameter'), { status: 400 }));

    await expect(withGroqRetry('invalid-config', generate)).rejects.toThrow('Unsupported model parameter');
    expect(generate).toHaveBeenCalledTimes(1);
  });
});
