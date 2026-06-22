'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { signIn, signInWithGoogle } from '@/lib/auth/service';
import { AUTH_PATHS, PASSWORD_REQUIREMENTS } from '@/lib/auth/constants';

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

function LockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="var(--brand)" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="var(--ai)" />
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="var(--warning)" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.166 6.656 3.58 9 3.58z" fill="var(--danger)" />
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
/*  LoginForm                                                          */
/* ------------------------------------------------------------------ */

export default function LoginForm() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-redirect if already authenticated
  useEffect(() => {
    if (initialized && user) {
      router.replace(AUTH_PATHS.DEFAULT_REDIRECT);
    }
  }, [initialized, user, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn({ email, password });

    if (result.success) {
      router.push(AUTH_PATHS.DEFAULT_REDIRECT);
    } else {
      setError(result.error?.message ?? 'Erro ao entrar. Tente novamente.');
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError('');
    setGoogleLoading(true);

    const result = await signInWithGoogle({
      redirectTo: AUTH_PATHS.DEFAULT_REDIRECT,
    });

    if (!result.success) {
      setError(result.error?.message ?? 'Erro ao autenticar com Google.');
      setGoogleLoading(false);
    }
  }

  // Don't render form if already authenticated
  if (initialized && user) return null;

  return (
    <div>
      {/* Header */}
      <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
        Bem-vindo de volta
      </h2>
      <p className="mt-2 text-[var(--text-3)]">
        Entre na sua conta para continuar
      </p>

      {/* Google OAuth */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={googleLoading || loading}
        className="
          mt-8 w-full flex items-center justify-center gap-3
          px-4 py-3 rounded-xl text-sm font-medium
          border border-[var(--border)]
          text-[var(--text)] bg-[var(--surface)]
          hover:bg-[var(--surface-2)]
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-[var(--duration-fast)]
        "
      >
        {googleLoading ? <SpinnerIcon /> : <GoogleIcon />}
        Continuar com Google
      </button>

      {/* Divider */}
      <div className="relative my-7">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border)]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="px-3 bg-[var(--bg)] text-[var(--text-3)]">
            ou continue com email
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Email
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
              <MailIcon />
            </span>
            <input
              id="email"
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

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Senha
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
              <LockIcon />
            </span>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              required
              minLength={PASSWORD_REQUIREMENTS.MIN_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="
                w-full pl-10 pr-11 py-3 rounded-xl text-sm
                bg-[var(--surface)] border border-[var(--border)]
                text-[var(--text)] placeholder:text-[var(--text-3)]
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                transition-all duration-[var(--duration-fast)]
              "
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
              aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
        </div>

        {/* Forgot password */}
        <div className="flex justify-end">
          <Link
            href={AUTH_PATHS.FORGOT_PASSWORD}
            className="text-xs font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || googleLoading}
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
          Entrar
        </button>
      </form>

      {/* Footer */}
      <p className="mt-8 text-center text-sm text-[var(--text-3)]">
        Não tem conta?{' '}
        <Link href={AUTH_PATHS.REGISTER} className="font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors">
          Criar conta grátis →
        </Link>
      </p>
    </div>
  );
}
