import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { handleApiError } from '@/lib/security';
import { extractTextFromImage } from '@/lib/ai/gemini';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const ALLOWED_TYPES: Record<string, number[]> = {
  'image/jpeg': [0xff, 0xd8, 0xff],
  'image/png': [0x89, 0x50, 0x4e, 0x47],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header; full check includes WEBP at offset 8
};

function validateMagicBytes(buffer: ArrayBuffer, declaredType: string): boolean {
  const expected = ALLOWED_TYPES[declaredType];
  if (!expected) return false;

  const bytes = new Uint8Array(buffer);
  if (bytes.length < expected.length) return false;

  for (let i = 0; i < expected.length; i++) {
    if (bytes[i] !== expected[i]) return false;
  }

  // WebP requires additional check: bytes 8-11 must be "WEBP"
  if (declaredType === 'image/webp') {
    if (bytes.length < 12) return false;
    const webpSig = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (webpSig !== 'WEBP') return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const userId = auth.userId;

    // 2. Rate limit: 10 requests per 60 minutes
    const rateResult = await checkRateLimit(userId, '/api/ocr', 10, 60);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas requisições',
          message: `Limite de OCR atingido. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        },
        { status: 429 },
      );
    }

    // 3. Parse multipart form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        { error: 'Requisição inválida', message: 'Envie a imagem como multipart/form-data.' },
        { status: 400 },
      );
    }

    const file = formData.get('image');
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: 'Imagem ausente', message: 'O campo "image" é obrigatório.' },
        { status: 400 },
      );
    }

    // 4. Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande', message: 'A imagem deve ter no máximo 5MB.' },
        { status: 413 },
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: 'Arquivo vazio', message: 'O arquivo enviado está vazio.' },
        { status: 400 },
      );
    }

    // 5. Validate MIME type
    const mimeType = file.type;
    if (!ALLOWED_TYPES[mimeType]) {
      return NextResponse.json(
        { error: 'Formato não suportado', message: 'Use JPG, PNG ou WebP.' },
        { status: 415 },
      );
    }

    // 6. Validate magic bytes
    const arrayBuffer = await file.arrayBuffer();
    if (!validateMagicBytes(arrayBuffer, mimeType)) {
      return NextResponse.json(
        { error: 'Arquivo inválido', message: 'O conteúdo do arquivo não corresponde ao formato declarado.' },
        { status: 415 },
      );
    }

    // 7. Convert to base64 and call Gemini OCR
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const text = await extractTextFromImage(base64, mimeType);

    return NextResponse.json({ text });
  } catch (error) {
    // Surface known user-facing errors with their messages
    if (error instanceof Error) {
      const userFacingMessages = [
        'identificar texto',
        'Tempo limite',
        'extrair texto',
      ];
      if (userFacingMessages.some((msg) => error.message.includes(msg))) {
        return NextResponse.json(
          { error: 'Falha no OCR', message: error.message },
          { status: 422 },
        );
      }
    }
    return handleApiError(error);
  }
}
