'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  OCR_ALLOWED_MIME_TYPES,
  ocrResponseSchema,
} from '@/lib/contracts/ocr';
import { ApiError, apiError, failureMessage } from '@/lib/client/api-errors';
import { useRetryDelay } from '@/lib/client/use-retry-delay';
import FlowStatus from '@/app/components/shared/FlowStatus';
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
      <p className="text-sm font-semibold text-[var(--text-2)]">Para uma leitura mais precisa:</p>
      <ul className="mt-2 space-y-1.5 text-sm text-[var(--text-3)]">
        {PHOTO_GUIDANCE.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="text-[var(--brand)]" aria-hidden="true">•</span>
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface PhotoUploadProps {
  onTextExtracted: (text: string) => void;
  currentText: string;
  disabled?: boolean;
}

export default function PhotoUpload({ onTextExtracted, currentText, disabled }: PhotoUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [optimized, setOptimized] = useState(false);
  const [extractedText, setExtractedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [retryAllowed, setRetryAllowed] = useState(false);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);
  const secondsToRetry = useRetryDelay(retryAt);
  const reviewRef = useRef<HTMLTextAreaElement>(null);
  const confirmRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
    setRetryAllowed(false);
    setConfirmReplace(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const sourceFile = event.target.files?.[0];
    if (!sourceFile || disabled) return;

    const selectionVersion = selectionVersionRef.current + 1;
    selectionVersionRef.current = selectionVersion;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setState('preparing');
    setSelectedFile(null);
    setPreviewUrl(null);
    setOptimized(false);
    setErrorMessage('');
    setRetryAllowed(false);
    setConfirmReplace(false);

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
  }, [disabled]);

  const handleExtract = useCallback(async () => {
    if (!selectedFile || disabled || secondsToRetry || requestControllerRef.current) return;

    const controller = new AbortController();
    requestControllerRef.current = controller;
    setState('extracting');
    setErrorMessage('');
    setRetryAllowed(false);
    setConfirmReplace(false);

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
        const code = payload && typeof payload === 'object' && 'code' in payload ? String(payload.code) : '';
        const problem = apiError(response, payload, 'Não foi possível extrair o texto agora. Sua foto foi mantida para tentar novamente.');
        setRetryAllowed(response.status >= 500 || [401, 408, 429].includes(response.status));
        setRetryAt(problem.retryAt);
        if (code === 'OCR_UNREADABLE') throw new ApiError('Não foi possível ler a redação. Tire outra foto com foco, boa iluminação e texto legível.', 'invalid');
        if (response.status === 400) throw new ApiError('A foto não pôde ser lida. Escolha uma imagem JPG, PNG ou WebP nítida.', 'invalid');
        throw problem;
      }
      const parsed = ocrResponseSchema.safeParse(payload);
      if (!parsed.success) {
        setRetryAllowed(true);
        throw new ApiError('Não conseguimos abrir o texto extraído. Tente extrair novamente com a mesma foto.', 'unavailable');
      }
      if (controller.signal.aborted) return;

      setExtractedText(parsed.data.text);
      setState('review');
    } catch (error) {
      if (controller.signal.aborted) return;
      setState('error');
      setErrorMessage(failureMessage(error, 'Não foi possível conectar. Sua foto foi mantida para tentar novamente.'));
      if (!(error instanceof ApiError)) setRetryAllowed(true);
    } finally {
      if (requestControllerRef.current === controller) {
        requestControllerRef.current = null;
      }
    }
  }, [selectedFile, disabled, secondsToRetry]);

  const applyText = useCallback(() => {
    if (disabled) return;
    onTextExtracted(extractedText);
    reset();
  }, [disabled, extractedText, onTextExtracted, reset]);

  const handleUseText = () => {
    if (currentText.trim() && currentText !== extractedText) setConfirmReplace(true);
    else applyText();
  };
  useEffect(() => { if (state === 'review') reviewRef.current?.focus(); }, [state]);
  useEffect(() => { if (confirmReplace) confirmRef.current?.focus(); }, [confirmReplace]);

  const fileInput = <>
    <input ref={fileInputRef} type="file" accept={OCR_ALLOWED_MIME_TYPES.join(',')}
      onClick={(event) => { event.currentTarget.value = ''; }} onChange={handleFileSelect}
      aria-label="Selecionar foto da redação" className="hidden" />
    <input ref={cameraInputRef} type="file" accept={OCR_ALLOWED_MIME_TYPES.join(',')} capture="environment"
      onClick={(event) => { event.currentTarget.value = ''; }} onChange={handleFileSelect}
      aria-label="Fotografar redação" className="hidden" />
  </>;

  if (state === 'idle') {
    return (
      <div className="px-5 py-3 border-b border-[var(--border)]">
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm font-medium text-[var(--text)]">Escreveu à mão? Transcreva sua foto.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={disabled} aria-describedby="photo-upload-guidance" className="inline-flex min-h-12 items-center gap-2 rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)]"><CameraIcon />Fotografar</button>
          <button
            type="button"
            onClick={openFilePicker}
            disabled={disabled}
            className="inline-flex min-h-12 items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[var(--duration-fast)]"
          >
            <CameraIcon />
            Escolher foto
          </button>
          </div>
          <p id="photo-upload-guidance" className="text-sm text-[var(--text-3)] leading-relaxed">
            A foto será transcrita para você revisar e aplicar ao editor antes da correção. Use boa iluminação e texto legível. JPEG, PNG ou WebP de até 20 MB; converta HEIC para JPEG antes de enviar.
          </p>
        </div>
        {fileInput}
      </div>
    );
  }

  const canRetrySamePhoto = retryAllowed && selectedFile !== null;

  return (
    <div className="border-b border-[var(--border)]">
      {fileInput}
      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--text-2)] uppercase tracking-wider flex items-center gap-2">
            <CameraIcon />
            Foto da redação
          </span>
          <button
            type="button"
            onClick={reset}
            disabled={disabled}
            aria-label="Fechar envio de foto"
            className="h-12 w-12 inline-flex items-center justify-center rounded-md text-[var(--text-3)] hover:text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors"
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

        {previewUrl && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)]">
              {/* Blob URLs are local previews and cannot use the Next.js image optimizer. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Foto da redação para comparação com o texto extraído" className="w-full max-h-96 object-contain" />
              {state === 'extracting' && (
                <div className="absolute inset-0 bg-[var(--bg)]/80 flex flex-col items-center justify-center gap-3" role="status">
                  <SpinnerIcon size={24} />
                  <span className="text-sm text-[var(--text-2)] font-medium">Extraindo texto da imagem...</span>
                </div>
              )}
            </div>

            <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center py-3 text-sm text-[var(--brand-hover)] underline">Abrir foto em tamanho completo</a>
            {optimized && (
              <p className="text-sm text-[var(--success)]">A foto foi otimizada no seu navegador antes do envio.</p>
            )}
            <PhotoGuidance />

            {state === 'preview' && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExtract}
                  disabled={disabled || secondsToRetry > 0}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--brand)] text-white hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)] transition-all duration-[var(--duration-fast)] shadow-sm"
                >
                  Extrair texto
                </button>
                <button
                  type="button"
                  onClick={openFilePicker}
                  disabled={disabled}
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
            <p className="text-sm text-[var(--text-3)]">
              Compare com a foto e revise o texto extraído. Você pode editá-lo antes de usar.
            </p>
            <textarea
              ref={reviewRef}
              disabled={disabled}
              value={extractedText}
              onChange={(event) => setExtractedText(event.target.value)}
              aria-label="Texto extraído da foto"
              className="w-full min-h-[160px] p-4 rounded-xl text-sm leading-relaxed bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] resize-y transition-all"
            />
            {confirmReplace && <div ref={confirmRef} tabIndex={-1} role="group" aria-label="Confirmar substituição da redação" className="rounded-xl border border-[var(--warning)]/40 p-4">
              <p className="text-sm text-[var(--text-2)]">Há um texto diferente no editor. Deseja substituí-lo pelo texto revisado da foto?</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={disabled} onClick={applyText} className="rounded-lg bg-[var(--brand)] px-4 py-3 text-sm text-white">Substituir redação</button>
                <button type="button" onClick={() => { setConfirmReplace(false); reviewRef.current?.focus(); }} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">Cancelar</button>
              </div>
            </div>}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUseText}
                disabled={disabled || !extractedText.trim()}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[var(--success)] text-[var(--bg)] hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-[var(--duration-fast)] shadow-sm"
              >
                <CheckIcon />
                Usar este texto
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={disabled}
                className="px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all duration-[var(--duration-fast)]"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="space-y-3" aria-live="polite">
            <FlowStatus error>
              <span className="shrink-0 mt-0.5"><AlertTriangleIcon /></span>
              <span>{errorMessage}</span>
            </FlowStatus>
            <PhotoGuidance />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={canRetrySamePhoto ? handleExtract : openFilePicker}
                disabled={disabled || (canRetrySamePhoto && secondsToRetry > 0)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[var(--border)] text-[var(--text-2)] hover:bg-[var(--surface-2)] transition-all duration-[var(--duration-fast)]"
              >
                <CameraIcon />
                {canRetrySamePhoto ? (secondsToRetry > 0 ? `Aguarde ${secondsToRetry}s` : 'Tentar novamente') : 'Escolher outra foto'}
              </button>
              <button
                type="button"
                onClick={reset}
                disabled={disabled}
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
