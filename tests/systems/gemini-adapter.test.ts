import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const gemini = vi.hoisted(() => ({ initialize: vi.fn(), generateContent: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@google/genai', () => ({
  ApiError: class ApiError extends Error {
    constructor(public readonly status: number) { super('Provider error'); }
  },
  GoogleGenAI: class GoogleGenAI {
    models = { generateContent: gemini.generateContent };
    constructor(options: unknown) { gemini.initialize(options); }
  },
}));

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('GEMINI_API_KEY', 'local-test-key');
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'info').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  gemini.initialize.mockReset();
  gemini.generateContent.mockReset();
});

describe('adaptador Gemini com cancelamento e fallback limitados', () => {
  it('não inicializa nem chama o provedor para uma requisição já cancelada', async () => {
    const { extractTextFromImage } = await import('../../lib/ai/gemini');
    const controller = new AbortController();
    controller.abort();

    await expect(extractTextFromImage('local-image', 'image/jpeg', controller.signal)).rejects.toMatchObject({
      kind: 'cancelled', attemptedModels: [],
    });
    expect(gemini.initialize).not.toHaveBeenCalled();
    expect(gemini.generateContent).not.toHaveBeenCalled();
  });

  it('impede fallback se o cancelamento coincide com uma resposta ilegível', async () => {
    const { extractTextFromImage } = await import('../../lib/ai/gemini');
    const controller = new AbortController();
    gemini.generateContent.mockImplementationOnce(async () => {
      controller.abort();
      return { text: '[EMPTY]' };
    });

    await expect(extractTextFromImage('local-image', 'image/jpeg', controller.signal)).rejects.toMatchObject({
      kind: 'cancelled', attemptedModels: ['gemini-3.5-flash'],
    });
    expect(gemini.generateContent).toHaveBeenCalledTimes(1);
  });

  it('desabilita retries do SDK e avança uma vez após um timeout de modelo', async () => {
    const { extractTextFromImage } = await import('../../lib/ai/gemini');
    vi.useFakeTimers();
    let timedOutSignal: AbortSignal | undefined;
    gemini.generateContent.mockImplementationOnce(({ config }: { config: { abortSignal: AbortSignal } }) => {
      timedOutSignal = config.abortSignal;
      return new Promise((_, reject) => {
        config.abortSignal.addEventListener('abort', () => reject(new DOMException('Timeout', 'AbortError')), { once: true });
      });
    });
    gemini.generateContent.mockResolvedValueOnce({ text: 'Texto legível e suficiente para validar o fallback do OCR.' });

    const extraction = extractTextFromImage('local-image', 'image/jpeg');
    await vi.advanceTimersByTimeAsync(25_000);
    await expect(extraction).resolves.toContain('Texto legível');
    expect(timedOutSignal?.aborted).toBe(true);
    expect(gemini.generateContent.mock.calls.map(([request]) => request.model)).toEqual([
      'gemini-3.5-flash', 'gemini-2.5-flash',
    ]);
    expect(gemini.initialize).toHaveBeenCalledWith(expect.objectContaining({
      httpOptions: { retryOptions: { attempts: 1 } },
    }));
    expect(vi.getTimerCount()).toBe(0);
  });

  it('encerra após erro de credenciais sem consumir os modelos de fallback', async () => {
    const { extractTextFromImage } = await import('../../lib/ai/gemini');
    gemini.generateContent.mockRejectedValueOnce({ status: 401 });

    await expect(extractTextFromImage('local-image', 'image/jpeg')).rejects.toMatchObject({
      kind: 'configuration', attemptedModels: ['gemini-3.5-flash'],
    });
    expect(gemini.generateContent).toHaveBeenCalledTimes(1);
  });
});
