'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { requestPasswordReset } from '@/lib/auth/service';
import { validateEmail } from '@/lib/auth/validation';
import { AUTH_PATHS } from '@/lib/auth/constants';

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

function MailIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  ForgotPasswordPage                                                 */
/* ------------------------------------------------------------------ */

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error ?? 'Email inválido');
      return;
    }

    setLoading(true);

    const result = await requestPasswordReset(email);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error?.message ?? 'Erro ao enviar email. Tente novamente.');
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-5 flex items-center justify-center">
          <CheckCircleIcon />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
          Verifique seu email
        </h2>
        <p className="mt-3 text-[var(--text-3)] text-sm leading-relaxed">
          Enviamos um link de recuperação para <br />
          <span className="font-medium text-[var(--text-2)]">{email}</span>
        </p>
        <p className="mt-2 text-xs text-[var(--text-3)]">
          Não recebeu? Verifique a pasta de spam.
        </p>
        <Link
          href={AUTH_PATHS.LOGIN}
          className="
            inline-flex items-center gap-2 mt-8
            text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors
          "
        >
          <ArrowLeftIcon /> Voltar para o login
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        href={AUTH_PATHS.LOGIN}
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors mb-8"
      >
        <ArrowLeftIcon /> Voltar
      </Link>

      {/* Header */}
      <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
        Recuperar senha
      </h2>
      <p className="mt-2 text-[var(--text-3)]">
        Digite seu email e enviaremos um link de recuperação
      </p>

      {/* Error alert */}
      {error && (
        <div className="mt-6 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="forgot-email" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
              <MailIcon />
            </span>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="
                w-full pl-10 pr-4 py-3 rounded-xl text-sm
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-3)]
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                transition-all duration-[var(--duration-fast)]
              "
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full flex items-center justify-center gap-2
            px-4 py-3 rounded-xl text-sm font-semibold
            bg-[var(--brand)] text-white
            hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors duration-[var(--duration-fast)]
            shadow-sm
          "
        >
          {loading ? <SpinnerIcon /> : null}
          Enviar link de recuperação
        </button>
      </form>
    </div>
  );
}
