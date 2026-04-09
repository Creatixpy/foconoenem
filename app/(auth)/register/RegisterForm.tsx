'use client';

/**
 * Register Form - Minimalist & Secure
 */

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { validateEmail, validatePassword } from '@/lib/auth/validation';
import { sanitizeRedirectPath } from '@/lib/auth/security';
import { AUTH_PATHS } from '@/lib/auth/constants';
import { signUp, signInWithGoogle } from '@/lib/auth/service';
import { useAuth } from '@/lib/auth/context';

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

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const redirectTo = sanitizeRedirectPath(
    searchParams.get('next'),
    AUTH_PATHS.DEFAULT_REDIRECT
  );

  const [nomeCompleto, setNomeCompleto] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<ReturnType<typeof validatePassword> | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(redirectTo);
    }
  }, [authLoading, user, router, redirectTo]);

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
    if (!nomeCompleto.trim()) {
      setError('Informe seu nome completo');
      return;
    }

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setError(emailValidation.error || 'Email inválido');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    setLoading(true);

    try {
      const result = await signUp({
        email: email.trim(),
        password,
        nomeCompleto: nomeCompleto.trim(),
        objetivo: objetivo.trim() || undefined,
      });

      if (!result.success) {
        setError(result.error?.message || 'Erro ao criar conta');
        return;
      }

      if (result.data?.needsConfirmation) {
        setSuccess(true);
      } else {
        router.replace(redirectTo);
        router.refresh();
      }
    } catch {
      setError('Ocorreu um erro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!nomeCompleto.trim()) {
      setError('Informe seu nome antes de continuar com Google');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const result = await signInWithGoogle({
        nomeCompleto: nomeCompleto.trim(),
        objetivo: objetivo.trim() || undefined,
        redirectTo,
      });

      if (!result.success) {
        setError(result.error?.message || 'Erro ao autenticar com Google');
        setLoading(false);
      }
    } catch {
      setError('Erro ao autenticar com Google');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // Success state
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
            Conta criada com sucesso!
          </h1>
          
          <p className="text-foreground/60 mb-8">
            Enviamos um email de confirmação para <strong className="text-foreground">{email}</strong>.
            <br />
            Verifique sua caixa de entrada e spam.
          </p>

          <div className="space-y-3">
            <Link
              href={`${AUTH_PATHS.LOGIN}?next=${encodeURIComponent(redirectTo)}`}
              className="block w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors text-center"
            >
              Ir para login
            </Link>
            
            <button
              onClick={() => setSuccess(false)}
              className="block w-full py-3 px-4 rounded-xl border border-border-color text-foreground font-medium hover:bg-muted-bg transition-colors"
            >
              Voltar ao cadastro
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      {/* Card */}
      <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/10 mb-4">
            <svg className="w-7 h-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            Crie sua conta
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            Comece a estudar de forma inteligente
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
            <label htmlFor="nome" className="block text-sm font-medium text-foreground mb-2">
              Nome completo <span className="text-danger">*</span>
            </label>
            <input
              id="nome"
              type="text"
              value={nomeCompleto}
              onChange={(e) => setNomeCompleto(e.target.value)}
              required
              autoComplete="name"
              autoFocus
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
              Email <span className="text-danger">*</span>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Senha <span className="text-danger">*</span>
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                disabled={loading}
                className="w-full px-4 py-3 pr-12 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
                placeholder="Crie uma senha segura"
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
            <label htmlFor="objetivo" className="block text-sm font-medium text-foreground mb-2">
              Seu objetivo no ENEM <span className="text-foreground/40">(opcional)</span>
            </label>
            <input
              id="objetivo"
              type="text"
              value={objetivo}
              onChange={(e) => setObjetivo(e.target.value)}
              disabled={loading}
              className="w-full px-4 py-3 rounded-xl border border-border-color bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors disabled:opacity-50"
              placeholder="Ex: Medicina na USP, 900 pontos..."
            />
          </div>

          <button
            type="submit"
            disabled={loading || (passwordStrength !== null && !passwordStrength.isValid)}
            className="w-full py-3 px-4 rounded-xl bg-primary hover:bg-primary-dark text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                Criando conta...
              </span>
            ) : (
              'Criar conta'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border-color" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 text-xs font-medium text-foreground/40 bg-card-bg uppercase tracking-wider">
              ou
            </span>
          </div>
        </div>

        {/* Google Button */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full py-3 px-4 rounded-xl border border-border-color bg-background hover:bg-muted-bg text-foreground font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continuar com Google
        </button>

        {/* Login Link */}
        <p className="mt-8 text-center text-sm text-foreground/60">
          Já tem uma conta?{' '}
          <Link
            href={`${AUTH_PATHS.LOGIN}?next=${encodeURIComponent(redirectTo)}`}
            className="font-medium text-primary hover:underline"
          >
            Fazer login
          </Link>
        </p>

        {/* Terms */}
        <p className="mt-4 text-center text-xs text-foreground/40">
          Ao criar conta, você concorda com nossos{' '}
          <a href="/termos" className="underline hover:text-foreground/70">
            Termos de Uso
          </a>{' '}
          e{' '}
          <a href="/privacidade" className="underline hover:text-foreground/70">
            Política de Privacidade
          </a>
        </p>
      </div>

      {/* Security badge */}
      <div className="mt-6 flex items-center justify-center gap-2 text-xs text-foreground/40">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
        <span>Seus dados são protegidos com criptografia</span>
      </div>
    </div>
  );
}
