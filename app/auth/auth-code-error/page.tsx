'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AUTH_PATHS } from '@/lib/auth/constants';

function WarningIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function AuthCodeError() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          router.push(AUTH_PATHS.LOGIN);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [router]);

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 bg-[var(--bg-base)]">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-6 flex items-center justify-center">
          <WarningIcon />
        </div>

        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Erro de autenticação
        </h1>
        <p className="mt-3 text-[var(--text-muted)] text-sm leading-relaxed">
          Ocorreu um problema ao autenticar. Tente novamente.
        </p>

        <Link
          href={AUTH_PATHS.LOGIN}
          className="
            inline-flex items-center justify-center gap-2 mt-8
            px-6 py-3 rounded-xl text-sm font-semibold
            bg-[var(--primary)] text-white
            hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
            transition-colors duration-[var(--duration-fast)]
            shadow-sm
          "
        >
          Voltar para login
        </Link>

        <p className="mt-4 text-xs text-[var(--text-muted)]">
          Redirecionando em {countdown}s...
        </p>
      </div>
    </div>
  );
}
