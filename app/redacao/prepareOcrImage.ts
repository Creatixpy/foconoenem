import {
  OCR_MAX_SOURCE_BYTES,
  OCR_MAX_UPLOAD_BYTES,
  calculateOcrImageDimensions,
  isOcrImageMimeType,
} from '@/lib/contracts/ocr';

const JPEG_QUALITIES = [0.9, 0.82, 0.74] as const;
const MAX_RESIZE_PASSES = 3;

export class OcrImagePreparationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OcrImagePreparationError';
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new OcrImagePreparationError('Não foi possível comprimir a imagem.'));
      }
    }, 'image/jpeg', quality);
  });
}

function createCanvas(
  bitmap: ImageBitmap,
  dimensions: { width: number; height: number },
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = dimensions.width;
  canvas.height = dimensions.height;

  const context = canvas.getContext('2d', { alpha: false });
  if (!context) {
    throw new OcrImagePreparationError('Seu navegador não conseguiu preparar a imagem.');
  }

  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function createOrientedBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return createImageBitmap(file);
  }
}

function toJpegFile(blob: Blob, originalName: string): File {
  const nameWithoutExtension = originalName.replace(/\.[^.]+$/, '') || 'redacao';
  return new File([blob], `${nameWithoutExtension}.jpg`, {
    type: 'image/jpeg',
    lastModified: Date.now(),
  });
}

export async function prepareOcrImage(file: File): Promise<{ file: File; optimized: boolean }> {
  if (!isOcrImageMimeType(file.type)) {
    throw new OcrImagePreparationError('Formato não suportado. Use JPG, PNG ou WebP.');
  }
  if (file.size === 0) {
    throw new OcrImagePreparationError('O arquivo selecionado está vazio.');
  }
  if (file.size > OCR_MAX_SOURCE_BYTES) {
    throw new OcrImagePreparationError('A foto original deve ter no máximo 20 MB.');
  }
  if (file.size <= OCR_MAX_UPLOAD_BYTES) {
    return { file, optimized: false };
  }
  if (typeof createImageBitmap !== 'function') {
    throw new OcrImagePreparationError(
      'Seu navegador não comprime fotos automaticamente. Escolha uma imagem de até 4 MB.',
    );
  }

  const bitmap = await createOrientedBitmap(file).catch(() => {
    throw new OcrImagePreparationError('Não foi possível abrir a imagem selecionada.');
  });

  try {
    let dimensions = calculateOcrImageDimensions(bitmap.width, bitmap.height);

    for (let pass = 0; pass < MAX_RESIZE_PASSES; pass += 1) {
      const canvas = createCanvas(bitmap, dimensions);
      let lastBlob: Blob | undefined;

      for (const quality of JPEG_QUALITIES) {
        const blob = await canvasToBlob(canvas, quality);
        if (blob.size <= OCR_MAX_UPLOAD_BYTES) {
          return { file: toJpegFile(blob, file.name), optimized: true };
        }
        lastBlob = blob;
      }

      if (!lastBlob) break;
      const reduction = Math.min(
        0.85,
        Math.sqrt(OCR_MAX_UPLOAD_BYTES / lastBlob.size) * 0.95,
      );
      dimensions = {
        width: Math.max(1, Math.floor(dimensions.width * reduction)),
        height: Math.max(1, Math.floor(dimensions.height * reduction)),
      };
    }
  } finally {
    bitmap.close();
  }

  throw new OcrImagePreparationError(
    'Não foi possível reduzir a foto com segurança. Escolha uma imagem menor ou mais bem enquadrada.',
  );
}
