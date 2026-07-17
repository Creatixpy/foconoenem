import { describe, expect, it, vi } from 'vitest';
import {
  OCR_MODELS,
  OcrError,
  OcrProviderError,
  isReadableOcrText,
  routeOcrModels,
  type OcrModel,
} from '../../lib/ai/ocr-routing';
import { calculateOcrImageDimensions } from '../../lib/contracts/ocr';

describe('roteamento e preparação do OCR', () => {
  it('usa o modelo de maior qualidade e encerra após o primeiro sucesso', async () => {
    const extract = vi.fn(async () => 'Uma redação perfeitamente legível para o teste do sistema.');

    const result = await routeOcrModels(extract);

    expect(result.model).toBe('gemini-3.5-flash');
    expect(result.attemptedModels).toEqual(['gemini-3.5-flash']);
    expect(extract).toHaveBeenCalledTimes(1);
  });

  it('avança na ordem definida para falha transitória e saída ilegível', async () => {
    const calls: OcrModel[] = [];
    const extract = vi.fn(async (model: OcrModel) => {
      calls.push(model);
      if (model === 'gemini-3.5-flash') {
        throw new OcrProviderError(model, 'retryable', 429);
      }
      if (model === 'gemini-2.5-flash') return '[EMPTY]';
      return 'Texto final legível retornado pelo modelo de maior capacidade diária.';
    });

    const result = await routeOcrModels(extract);

    expect(calls).toEqual([...OCR_MODELS]);
    expect(result.model).toBe('gemini-3.1-flash-lite');
  });

  it('não desperdiça cota após erro permanente e tipa imagens ilegíveis', async () => {
    const fatalExtract = vi.fn(async (model: OcrModel): Promise<string> => {
      throw new OcrProviderError(model, 'fatal', 400);
    });

    await expect(routeOcrModels(fatalExtract)).rejects.toMatchObject({
      kind: 'unavailable',
      attemptedModels: ['gemini-3.5-flash'],
    });
    expect(fatalExtract).toHaveBeenCalledTimes(1);

    await expect(routeOcrModels(async () => '[ilegível]')).rejects.toSatisfy((error) => (
      error instanceof OcrError && error.kind === 'unreadable'
    ));
    expect(isReadableOcrText('[ilegível]')).toBe(false);
  });

  it('reduz somente dimensões que excedem o limite visual', () => {
    expect(calculateOcrImageDimensions(4_000, 3_000)).toEqual({
      width: 2_400,
      height: 1_800,
    });
    expect(calculateOcrImageDimensions(1_200, 1_600)).toEqual({
      width: 1_200,
      height: 1_600,
    });
  });
});
