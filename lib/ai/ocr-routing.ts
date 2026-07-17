export const OCR_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-3.1-flash-lite',
] as const;

export type OcrModel = (typeof OCR_MODELS)[number];
export type OcrProviderFailureKind =
  | 'retryable'
  | 'configuration'
  | 'cancelled'
  | 'fatal';
export type OcrFailureKind = 'unreadable' | 'unavailable' | 'configuration' | 'cancelled';

export class OcrProviderError extends Error {
  constructor(
    public readonly model: OcrModel,
    public readonly kind: OcrProviderFailureKind,
    public readonly status?: number,
    cause?: unknown,
  ) {
    super(`OCR provider failed for ${model}`, { cause });
    this.name = 'OcrProviderError';
  }
}

export class OcrError extends Error {
  constructor(
    public readonly kind: OcrFailureKind,
    public readonly attemptedModels: readonly OcrModel[],
    cause?: unknown,
  ) {
    super(`OCR failed: ${kind}`, { cause });
    this.name = 'OcrError';
  }
}

export type OcrRouteResult = {
  text: string;
  model: OcrModel;
  attemptedModels: readonly OcrModel[];
};

const EMPTY_MARKER = '[EMPTY]';
const ILLEGIBLE_MARKER_PATTERN = /\[ilegível\]/giu;
const MIN_READABLE_LETTERS = 20;

export function normalizeOcrText(value: string): string {
  return value.replace(/\r\n?/g, '\n').trim();
}

export function isReadableOcrText(value: string): boolean {
  const normalized = normalizeOcrText(value);
  if (!normalized || normalized.toUpperCase() === EMPTY_MARKER) {
    return false;
  }

  const withoutMarkers = normalized.replace(ILLEGIBLE_MARKER_PATTERN, '');
  return (withoutMarkers.match(/\p{L}/gu)?.length ?? 0) >= MIN_READABLE_LETTERS;
}

export async function routeOcrModels(
  extract: (model: OcrModel) => Promise<string>,
  models: readonly OcrModel[] = OCR_MODELS,
): Promise<OcrRouteResult> {
  const attemptedModels: OcrModel[] = [];
  let foundUnreadableOutput = false;
  let lastError: OcrProviderError | undefined;

  for (const model of models) {
    attemptedModels.push(model);

    try {
      const text = normalizeOcrText(await extract(model));
      if (isReadableOcrText(text)) {
        return { text, model, attemptedModels };
      }
      foundUnreadableOutput = true;
    } catch (error) {
      if (!(error instanceof OcrProviderError)) {
        throw new OcrError('unavailable', attemptedModels, error);
      }

      lastError = error;
      if (error.kind === 'cancelled') {
        throw new OcrError('cancelled', attemptedModels, error);
      }
      if (error.kind === 'configuration') {
        throw new OcrError('configuration', attemptedModels, error);
      }
      if (error.kind === 'fatal') {
        throw new OcrError('unavailable', attemptedModels, error);
      }
    }
  }

  throw new OcrError(
    foundUnreadableOutput ? 'unreadable' : 'unavailable',
    attemptedModels,
    lastError,
  );
}
