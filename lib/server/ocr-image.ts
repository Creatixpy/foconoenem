import 'server-only';

import type { OcrErrorCode, OcrImageMimeType } from '@/lib/contracts/ocr';
import {
  OCR_MAX_UPLOAD_BYTES,
  isOcrImageMimeType,
} from '@/lib/contracts/ocr';

const FILE_SIGNATURES: Record<OcrImageMimeType, readonly number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46],
};

export class OcrImageError extends Error {
  constructor(
    public readonly code: OcrErrorCode,
    public readonly status: number,
    public readonly publicMessage: string,
  ) {
    super(code);
    this.name = 'OcrImageError';
  }
}

function hasValidSignature(buffer: ArrayBuffer, mimeType: OcrImageMimeType): boolean {
  const bytes = new Uint8Array(buffer);
  const expected = FILE_SIGNATURES[mimeType];

  if (bytes.length < expected.length || expected.some((byte, index) => bytes[index] !== byte)) {
    return false;
  }

  if (mimeType !== 'image/webp') {
    return true;
  }

  return bytes.length >= 12
    && bytes[8] === 0x57
    && bytes[9] === 0x45
    && bytes[10] === 0x42
    && bytes[11] === 0x50;
}

export async function parseOcrImage(formData: FormData): Promise<{
  base64Data: string;
  mimeType: OcrImageMimeType;
}> {
  const file = formData.get('image');
  if (!(file instanceof File)) {
    throw new OcrImageError('OCR_IMAGE_REQUIRED', 400, 'O campo "image" é obrigatório.');
  }
  if (file.size === 0) {
    throw new OcrImageError('OCR_FILE_EMPTY', 400, 'O arquivo enviado está vazio.');
  }
  if (file.size > OCR_MAX_UPLOAD_BYTES) {
    throw new OcrImageError(
      'OCR_FILE_TOO_LARGE',
      413,
      'A imagem preparada para envio deve ter no máximo 4 MB.',
    );
  }
  if (!isOcrImageMimeType(file.type)) {
    throw new OcrImageError('OCR_UNSUPPORTED_TYPE', 415, 'Use JPG, PNG ou WebP.');
  }

  const buffer = await file.arrayBuffer();
  if (!hasValidSignature(buffer, file.type)) {
    throw new OcrImageError(
      'OCR_INVALID_FILE',
      415,
      'O conteúdo do arquivo não corresponde ao formato declarado.',
    );
  }

  return {
    base64Data: Buffer.from(buffer).toString('base64'),
    mimeType: file.type,
  };
}
