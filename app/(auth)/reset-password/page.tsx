'use client';

/**
 * Reset Password Page
 */

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { validatePassword } from '@/lib/auth/validation';
import { AUTH_PATHS } from '@/lib/auth/constants';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

function getPasswordStrengthColor(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak': return 'text-danger';
    case 'fair': return 'text-warning';
    case 'good': return 'text-warning';
    case 'strong': return 'text-success';
    default: return 'text-gray-500';
  }
}

function getPasswordStrengthLabel(strength: 'weak' | 'fair' | 'good' | 'strong'): string {
  switch (strength) {
    case 'weak': return 'Fraca';
    case 'fair': return 'Razoável';
    case 'good': return 'Boa';
    case 'strong': return 'Forte';
    default: return '';
  }
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePassword> | null>(null);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  // Check for a valid recovery session
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  }, []);

  // Validate password on change
  useEffect(() => {
    if (password.length > 0) {
      setPasswordStrength(validatePassword(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;

    setError(null);

    // Validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setError('Erro ao atualizar senha. Tente novamente.');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (hasSession === null) {
    return (
      <div className="w-full max-w-md flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Link inválido ou expirado
          </h1>
          <p className="text-foreground/60 mb-8">
            Solicite um novo link de redefinição de senha.
          </p>
          <Link
            href={AUTH_PATHS.FORGOT_PASSWORD}
            className="block w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors text-center"
          >
            Solicitar novo link
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="w-full max-w-md">
        <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mb-6">
            <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-foreground mb-3">
            Senha atualizada!
          </h1>
          
          <p className="text-foreground/60 mb-8">
            Sua senha foi alterada com sucesso. Você já pode usar a nova senha para acessar sua conta.
          </p>

          <Link
            href={AUTH_PATHS.DEFAULT_REDIRECT}
            className="block w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors text-center"
          >
            Ir para o painel
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Nova senha
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Escolha uma senha forte para proteger sua conta
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-danger/10 border border-danger/20">
            <p className="text-sm text-danger text-center">
              {error}
            </p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Nova senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                autoFocus
                disabled={loading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
                placeholder="Digite sua nova senha"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground/70"
                tabIndex={-1}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Password strength indicator */}
            {passwordStrength && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 h-1.5 bg-muted-bg rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        passwordStrength.strength === 'weak' ? 'w-1/4 bg-danger' :
                        passwordStrength.strength === 'fair' ? 'w-2/4 bg-warning' :
                        passwordStrength.strength === 'good' ? 'w-3/4 bg-warning' :
                        'w-full bg-success'
                      }`}
                    />
                  </div>
                  <span className={`text-xs font-medium ${getPasswordStrengthColor(passwordStrength.strength)}`}>
                    {getPasswordStrengthLabel(passwordStrength.strength)}
                  </span>
                </div>
                {passwordStrength.errors.length > 0 && (
                  <p className="text-xs text-foreground/60">
                    {passwordStrength.errors[0]}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
              Confirmar senha
            </label>
            <input
              id="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
              placeholder="Digite a senha novamente"
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-danger">As senhas não coincidem</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || (passwordStrength && !passwordStrength.isValid) || password !== confirmPassword}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Atualizando...
              </span>
            ) : (
              'Atualizar senha'
            )}
          </button>
        </form>

        {/* Back to login */}
        <p className="mt-8 text-center text-sm text-foreground/60">
          <Link
            href={AUTH_PATHS.LOGIN}
            className="font-medium text-primary hover:underline"
          >
            ← Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
