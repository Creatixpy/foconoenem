'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OCR_ALLOWED_MIME_TYPES,
  ocrResponseSchema,
  type OcrErrorCode,
} from '@/lib/contracts/ocr';
import {
  OcrImagePreparationError,
  prepareOcrImage,
} from './prepareOcrImage';

type UploadState = 'idle' | 'preparing' | 'preview' | 'extracting' | 'review' | 'error';

const PHOTO_GUIDANCE = [
  'Use boa iluminação, sem sombras ou reflexos.',
  'Mantenha a câmera paralela e enquadre todo o texto.',
  'Confira se a foto está nítida e a escrita está legível.',
] as const;

class OcrRequestError extends Error {
  constructor(message: string, public readonly code?: OcrErrorCode) {
    super(message);
    this.name = 'OcrRequestError';
  }
}

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function PhotoGuidance() {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
      <p className="text-xs font-semibold text-[var(--text-2)]">Para uma leitura mais precisa:</p>
      <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-3)]">
        {PHOTO_GUIDANCE.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[var(--brand)]" aria-hidden="true">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PhotoUploadProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ onTextExtracted, disabled }: PhotoUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimized, setOptimized] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [errorCode, setErrorCode] = useState<OcrErrorCode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const selectionVersionRef = useRef(0);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    return () => {
      selectionVersionRef.current += 1;
      requestControllerRef.current?.abort();
    };
  }, []);

  const reset = useCallback(() => {
    selectionVersionRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setState('idle');
    setPreviewUrl(null);
    setSelectedFile(null);
    setOptimized(false);
    setExtractedText('');
    setErrorMessage('');
    setErrorCode(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const sourceFile = event.target.files?.[0];
    if (!sourceFile) return;

    const selectionVersion = selectionVersionRef.current + 1;
    selectionVersionRef.current = selectionVersion;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setState('preparing');
    setSelectedFile(null);
    setPreviewUrl(null);
    setOptimized(false);
    setErrorMessage('');
    setErrorCode(null);

    try {
      const prepared = await prepareOcrImage(sourceFile);
      if (selectionVersionRef.current !== selectionVersion) return;

      setSelectedFile(prepared.file);
      setOptimized(prepared.optimized);
      setPreviewUrl(URL.createObjectURL(prepared.file));
      setState('preview');
    } catch (error) {
      if (selectionVersionRef.current !== selectionVersion) return;
      setState('error');
      setErrorMessage(
        error instanceof OcrImagePreparationError
          ? error.message
          : 'Não foi possível preparar a foto. Escolha outra imagem.',
      );
    }
  }, []);

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return;

    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    setState('extracting');
    setErrorMessage('');
    setErrorCode(null);

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const code = payload && typeof payload === 'object' && 'code' in payload
          ? String(payload.code) as OcrErrorCode
          : undefined;
        const serverMessage = payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : undefined;

        if (response.status === 401) {
          throw new OcrRequestError('Sessão expirada. Faça login novamente.', code);
        }
        if (response.status === 429) {
          throw new OcrRequestError('Muitas tentativas. Aguarde antes de tentar novamente.', code);
        }
        throw new OcrRequestError(
          serverMessage ?? 'Não foi possível extrair o texto. Tente com outra foto.',
          code,
        );
      }

      const parsed = ocrResponseSchema.safeParse(payload);
      if (!parsed.success) {
        throw new OcrRequestError('O serviço retornou um texto inválido. Tente novamente.');
      }

      setExtractedText(parsed.data.text);
      setState('review');
    } catch (error) {
      if (controller.signal.aborted) return;
      setState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erro de conexão. Tente novamente.');
      setErrorCode(error instanceof OcrRequestError ? error.code ?? null : null);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }, [selectedFile]);

  const handleUseText = useCallback(() => {
    onTextExtracted(extractedText);
    reset();
  }, [extractedText, onTextExtracted, reset]);

  const fileInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept={OCR_ALLOWED_MIME_TYPES.join(',')}
      onClick={(event) => { event.currentTarget.value = ''; }}
      onChange={handleFileSelect}
      aria-describedby="photo-upload-guidance"
      className="hidden"
    />
  );

  if (state === 'idle') {
    return (
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[var(--duration-fast)]"
          >
            <CameraIcon />
            Enviar foto da redação
          </button>
          <p id="photo-upload-guidance" className="text-xs text-[var(--text-3)] leading-relaxed">
            Fotografe com boa iluminação, foco nítido e todo o texto legível. Fotos de até 20 MB são otimizadas antes do envio.
          </p>
        </div>
        {fileInput}
      </div>
    );
  }

  const canRetrySamePhoto = errorCode === 'OCR_UNAVAILABLE' && selectedFile !== null;

  return (
    <div className="border-b border-[var(--border)]">
      {fileInput}
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-2">
            <CameraIcon />
            Foto da redação
          </span>
          <button
            type="button"
            onClick={reset}
            aria-label="Fechar envio de foto"
            className="p-1 rounded-md text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {state === 'preparing' && (
          <div className="flex items-center justify-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-8" role="status">
            <SpinnerIcon size={22} />
            <span className="text-sm text-[var(--text-2)] font-medium">Otimizando a foto com segurança...</span>
          </div>
        )}

        {(state === 'preview' || state === 'extracting') && previewUrl && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
              {/* Blob URLs are local previews and cannot use the Next.js image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Prévia da redação" className="w-full max-h-48 object-contain" />
              {state === 'extracting' && (
                <div className="absolute inset-0 bg-[var(--bg)]/80 flex flex-col items-center justify-center gap-3" role="status">
                  <SpinnerIcon size={24} />
                  <span className="text-sm text-[var(--text-2)] font-medium">Extraindo texto da imagem...</span>
                </div>
              )}
            </div>

            {optimized && (
              <p className="text-xs text-[var(--success)]">A foto foi otimizada no seu navegador antes do envio.</p>
            )}
            <PhotoGuidance />

            {state === 'preview' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExtract}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] transition-all duration-[var(--duration-fast)] shadow-sm"
                >
                  Extrair texto
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all duration-[var(--duration-fast)]"
                >
                  Trocar foto
                </button>
              </div>
            )}
          </div>
        )}

        {state === 'review' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-3)]">
              Compare com a foto e revise o texto extraído. Você pode editá-lo antes de usar.
            </p>
            <textarea
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              aria-label="Texto extraído da foto"
              className="w-full min-h-[160px] p-4 rounded-xl text-sm leading-relaxed bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] resize-none outline-none focus:border-[var(--brand)]/50 focus:ring-1 focus:ring-[var(--brand)]/20 transition-all"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseText}
                disabled={!extractedText.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--success)] text-white hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[var(--duration-fast)] shadow-sm"
              >
                <CheckIcon />
                Usar este texto
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all duration-[var(--duration-fast)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-3" aria-live="polite">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
              <span className="shrink-0 mt-0.5"><AlertTriangleIcon /></span>
              <span>{errorMessage}</span>
            </div>
            <PhotoGuidance />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={canRetrySamePhoto ? handleExtract : openFilePicker}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all duration-[var(--duration-fast)]"
              >
                <CameraIcon />
                {canRetrySamePhoto ? 'Tentar novamente' : 'Escolher outra foto'}
              </button>
              <button
                type="button"
                onClick={reset}
                className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
