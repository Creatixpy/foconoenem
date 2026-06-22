'use client';

import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AuthProviders from '@/app/auth-providers';
import { useAuth } from '@/lib/auth/context';
import { updatePassword } from '@/lib/auth/service';
import { validatePassword, getPasswordStrengthLabel } from '@/lib/auth/validation';
import { AUTH_PATHS } from '@/lib/auth/constants';
import type { PasswordValidationResult } from '@/lib/auth/types';

type PasswordStrength = PasswordValidationResult['strength'];

/* ------------------------------------------------------------------ */
/*  Icons                                                              */
/* ------------------------------------------------------------------ */

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

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
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

/* ------------------------------------------------------------------ */
/*  Strength bar                                                       */
/* ------------------------------------------------------------------ */

const STRENGTH_COLORS: Record<PasswordStrength, string> = {
  weak: 'var(--danger)',
  fair: 'var(--warning)',
  good: 'var(--brand)',
  strong: 'var(--success)',
};

const STRENGTH_SEGMENTS: Record<PasswordStrength, number> = {
  weak: 1,
  fair: 2,
  good: 3,
  strong: 4,
};

/* ------------------------------------------------------------------ */
/*  ResetPasswordPage                                                  */
/* ------------------------------------------------------------------ */

function ResetPasswordPageContent() {
  const router = useRouter();
  const { user, initialized } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordValidation, setPasswordValidation] = useState<{ strength: PasswordStrength; isValid: boolean } | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Session guard: redirect if no valid session
  useEffect(() => {
    if (initialized && !user) {
      router.replace(AUTH_PATHS.LOGIN);
    }
  }, [initialized, user, router]);

  // Real-time password validation
  const handlePasswordChange = useCallback((value: string) => {
    setPassword(value);
    if (value) {
      const result = validatePassword(value);
      setPasswordValidation({ strength: result.strength, isValid: result.isValid });
    } else {
      setPasswordValidation(null);
    }
  }, []);

  // Redirect to /conta after success
  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => {
      router.push(AUTH_PATHS.DEFAULT_REDIRECT);
    }, 2000);
    return () => clearTimeout(timer);
  }, [success, router]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const validation = validatePassword(password);
    if (!validation.isValid) {
      setError('A senha não atende aos requisitos mínimos.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error?.message ?? 'Erro ao redefinir senha. Tente novamente.');
    }
    setLoading(false);
  }

  // Loading state while checking auth
  if (!initialized) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerIcon />
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-5 flex items-center justify-center">
          <CheckCircleIcon />
        </div>
        <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
          Senha redefinida!
        </h2>
        <p className="mt-3 text-[var(--text-3)] text-sm">
          Redirecionando para seu painel...
        </p>
      </div>
    );
  }

  // Not authenticated — don't render form
  if (!user) return null;

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  return (
    <div>
      {/* Header */}
      <h2 className="text-2xl font-bold text-[var(--text)] tracking-tight">
        Nova senha
      </h2>
      <p className="mt-2 text-[var(--text-3)]">
        Escolha uma senha forte para sua conta
      </p>

      {/* Error alert */}
      {error && (
        <div className="mt-6 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        {/* New password */}
        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Nova senha
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
              <LockIcon />
            </span>
            <input
              id="new-password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Mínimo 8 caracteres"
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

          {/* Strength meter */}
          {passwordValidation && (
            <div className="mt-2.5">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((seg) => (
                  <div
                    key={seg}
                    className="h-1 flex-1 rounded-full transition-colors duration-300"
                    style={{
                      backgroundColor: seg <= STRENGTH_SEGMENTS[passwordValidation.strength]
                        ? STRENGTH_COLORS[passwordValidation.strength]
                        : 'var(--border)',
                    }}
                  />
                ))}
              </div>
              <p className="mt-1.5 text-xs" style={{ color: STRENGTH_COLORS[passwordValidation.strength] }}>
                Senha {getPasswordStrengthLabel(passwordValidation.strength)}
              </p>
            </div>
          )}
        </div>

        {/* Confirm password */}
        <div>
          <label htmlFor="confirm-password" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Confirmar senha
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-3)]">
              <LockIcon />
            </span>
            <input
              id="confirm-password"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              autoComplete="new-password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repita a senha"
              className={`
                w-full pl-10 pr-11 py-3 rounded-xl text-sm
                bg-[var(--surface)] border
                text-[var(--text)] placeholder:text-[var(--text-3)]
                focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
                transition-all duration-[var(--duration-fast)]
                ${passwordsMismatch ? 'border-[var(--danger)]' : passwordsMatch ? 'border-[var(--success)]' : 'border-[var(--border)]'}
              `}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
              aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
            >
              {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          {passwordsMismatch && (
            <p className="mt-1.5 text-xs text-[var(--danger)]">As senhas não coincidem</p>
          )}
          {passwordsMatch && (
            <p className="mt-1.5 text-xs text-[var(--success)]">Senhas coincidem ✓</p>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading || !passwordValidation?.isValid || !passwordsMatch}
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
          Redefinir senha
        </button>
      </form>

      {/* Back link */}
      <p className="mt-8 text-center">
        <Link
          href={AUTH_PATHS.LOGIN}
          className="text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors"
        >
          Voltar para o login
        </Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthProviders>
      <ResetPasswordPageContent />
    </AuthProviders>
  );
}
