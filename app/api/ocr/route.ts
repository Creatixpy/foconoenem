import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromImage } from '@/lib/ai/gemini';
import { OcrError } from '@/lib/ai/ocr-routing';
import type { OcrErrorCode } from '@/lib/contracts/ocr';
import { handleApiError } from '@/lib/security';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { OcrImageError, parseOcrImage } from '@/lib/server/ocr-image';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

function ocrErrorResponse(
  code: OcrErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ error: 'Falha no OCR', code, message }, { status });
}

export async function POST(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) return originError;

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) return auth.error;

    const rateResult = await checkRateLimit(auth.userId, '/api/ocr', 10, 60);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas requisições',
          code: 'OCR_RATE_LIMITED' satisfies OcrErrorCode,
          message: `Limite de OCR atingido. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        },
        { status: 429 },
      );
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return ocrErrorResponse(
        'OCR_INVALID_REQUEST',
        'Envie a imagem como multipart/form-data.',
        400,
      );
    }

    const image = await parseOcrImage(formData);
    const text = await extractTextFromImage(
      image.base64Data,
      image.mimeType,
      request.signal,
    );

    return NextResponse.json({ text });
  } catch (error) {
    if (error instanceof OcrImageError) {
      return ocrErrorResponse(error.code, error.publicMessage, error.status);
    }
    if (error instanceof OcrError) {
      if (error.kind === 'unreadable') {
        return ocrErrorResponse(
          'OCR_UNREADABLE',
          'Não foi possível ler a redação. Tire outra foto com foco, boa iluminação e texto legível.',
          422,
        );
      }
      if (error.kind === 'cancelled') {
        return ocrErrorResponse('OCR_UNAVAILABLE', 'A extração foi cancelada.', 408);
      }
      return ocrErrorResponse(
        'OCR_UNAVAILABLE',
        'O serviço de leitura está temporariamente indisponível. Tente novamente em instantes.',
        503,
      );
    }
    return handleApiError(error);
  }
}
