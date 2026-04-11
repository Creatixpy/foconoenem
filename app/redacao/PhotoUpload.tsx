'use client';

import { useState, useRef, useCallback } from 'react';

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

type UploadState = 'idle' | 'preview' | 'extracting' | 'review' | 'error';

/* ================================================================== */
/*  Icons                                                              */
/* ================================================================== */

function CameraIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
      <circle cx="12" cy="13" r="3" />
    </svg>
  );
}

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ================================================================== */
/*  Component                                                          */
/* ================================================================== */

interface PhotoUploadProps {
  onTextExtracted: (text: string) => void;
  disabled?: boolean;
}

export default function PhotoUpload({ onTextExtracted, disabled }: PhotoUploadProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setState('idle');
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setSelectedFile(null);
    setExtractedText('');
    setErrorMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side validation
    if (!ALLOWED_TYPES.includes(file.type)) {
      setState('error');
      setErrorMessage('Formato não suportado. Use JPG, PNG ou WebP.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setState('error');
      setErrorMessage('A imagem deve ter no máximo 5MB.');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setState('preview');
    setErrorMessage('');
  }, []);

  const handleExtract = useCallback(async () => {
    if (!selectedFile) return;

    setState('extracting');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('image', selectedFile);

      const res = await fetch('/api/ocr', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (res.status === 429) {
          throw new Error('Muitas tentativas. Aguarde antes de tentar novamente.');
        }
        if (res.status === 401) {
          throw new Error('Sessão expirada. Faça login novamente.');
        }
        throw new Error(json.message ?? 'Não foi possível extrair o texto. Tente com outra foto.');
      }

      const { text } = await res.json();
      setExtractedText(text);
      setState('review');
    } catch (err) {
      setState('error');
      setErrorMessage(
        err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.',
      );
    }
  }, [selectedFile]);

  const handleUseText = useCallback(() => {
    onTextExtracted(extractedText);
    reset();
  }, [extractedText, onTextExtracted, reset]);

  // ---- Idle state: just the trigger button ----
  if (state === 'idle') {
    return (
      <div className="px-5 py-3 border-b border-[var(--border-color)]">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled}
          className="
            inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium
            border border-[var(--border-color)] text-[var(--text-secondary)]
            hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
            disabled:opacity-40 disabled:cursor-not-allowed
            transition-all duration-[var(--duration-fast)]
          "
        >
          <CameraIcon />
          Enviar foto da redação
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  // ---- All other states: expanded panel ----
  return (
    <div className="border-b border-[var(--border-color)]">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="px-5 py-4 space-y-4">
        {/* Header with close button */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-2">
            <CameraIcon />
            Foto da redação
          </span>
          <button
            type="button"
            onClick={reset}
            className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Preview state */}
        {(state === 'preview' || state === 'extracting') && previewUrl && (
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden border border-[var(--border-color)] bg-[var(--bg-elevated)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Prévia da redação"
                className="w-full max-h-48 object-contain"
              />
              {state === 'extracting' && (
                <div className="absolute inset-0 bg-[var(--bg-base)]/80 flex flex-col items-center justify-center gap-3">
                  <SpinnerIcon size={24} />
                  <span className="text-sm text-[var(--text-secondary)] font-medium">
                    Extraindo texto da imagem...
                  </span>
                </div>
              )}
            </div>

            {state === 'preview' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleExtract}
                  className="
                    flex-1 flex items-center justify-center gap-2
                    px-4 py-2.5 rounded-xl text-sm font-semibold
                    bg-[var(--primary)] text-white
                    hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
                    transition-all duration-[var(--duration-fast)]
                    shadow-sm
                  "
                >
                  Extrair texto
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="
                    px-4 py-2.5 rounded-xl text-sm font-medium
                    border border-[var(--border-color)] text-[var(--text-secondary)]
                    hover:bg-[var(--bg-elevated)]
                    transition-all duration-[var(--duration-fast)]
                  "
                >
                  Trocar foto
                </button>
              </div>
            )}
          </div>
        )}

        {/* Review state */}
        {state === 'review' && (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)]">
              Revise o texto extraído. Você pode editá-lo antes de usar.
            </p>
            <textarea
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              className="
                w-full min-h-[160px] p-4 rounded-xl
                text-sm leading-relaxed
                bg-[var(--bg-elevated)] text-[var(--text-primary)]
                border border-[var(--border-color)]
                resize-none outline-none
                focus:border-[var(--primary)]/50 focus:ring-1 focus:ring-[var(--primary)]/20
                transition-all
              "
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleUseText}
                disabled={!extractedText.trim()}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl text-sm font-semibold
                  bg-[var(--success)] text-white
                  hover:brightness-110 active:brightness-95
                  disabled:opacity-40 disabled:cursor-not-allowed
                  transition-all duration-[var(--duration-fast)]
                  shadow-sm
                "
              >
                <CheckIcon />
                Usar este texto
              </button>
              <button
                type="button"
                onClick={reset}
                className="
                  px-4 py-2.5 rounded-xl text-sm font-medium
                  border border-[var(--border-color)] text-[var(--text-secondary)]
                  hover:bg-[var(--bg-elevated)]
                  transition-all duration-[var(--duration-fast)]
                "
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Error state */}
        {state === 'error' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-sm bg-[var(--danger-light)] text-[var(--danger)] border border-[var(--danger)]/20">
              <span className="shrink-0 mt-0.5"><AlertTriangleIcon /></span>
              <span>{errorMessage}</span>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="
                  flex-1 flex items-center justify-center gap-2
                  px-4 py-2.5 rounded-xl text-sm font-medium
                  border border-[var(--border-color)] text-[var(--text-secondary)]
                  hover:bg-[var(--bg-elevated)]
                  transition-all duration-[var(--duration-fast)]
                "
              >
                <CameraIcon />
                Tentar outra foto
              </button>
              <button
                type="button"
                onClick={reset}
                className="
                  px-4 py-2.5 rounded-xl text-sm font-medium
                  text-[var(--text-muted)] hover:text-[var(--text-secondary)]
                  transition-colors
                "
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
