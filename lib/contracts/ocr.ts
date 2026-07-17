import { z } from 'zod';

export const OCR_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type OcrImageMimeType = (typeof OCR_ALLOWED_MIME_TYPES)[number];

// Leaves headroom below Vercel's 4.5 MB Function payload limit for multipart metadata.
export const OCR_MAX_UPLOAD_BYTES = 4_000_000;
export const OCR_MAX_SOURCE_BYTES = 20 * 1024 * 1024;
export const OCR_MAX_LONG_EDGE = 2_400;

export const ocrResponseSchema = z.object({
  text: z.string().trim().min(1),
}).strict();

export type OcrErrorCode =
  | 'OCR_RATE_LIMITED'
  | 'OCR_INVALID_REQUEST'
  | 'OCR_IMAGE_REQUIRED'
  | 'OCR_FILE_EMPTY'
  | 'OCR_FILE_TOO_LARGE'
  | 'OCR_UNSUPPORTED_TYPE'
  | 'OCR_INVALID_FILE'
  | 'OCR_UNREADABLE'
  | 'OCR_UNAVAILABLE';

export function isOcrImageMimeType(value: string): value is OcrImageMimeType {
  return OCR_ALLOWED_MIME_TYPES.some((mimeType) => mimeType === value);
}

export function calculateOcrImageDimensions(
  width: number,
  height: number,
  maxLongEdge = OCR_MAX_LONG_EDGE,
): { width: number; height: number } {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    throw new RangeError('Invalid OCR image dimensions');
  }

  const scale = Math.min(1, maxLongEdge / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
