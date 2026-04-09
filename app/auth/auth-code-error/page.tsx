'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthCodeError() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionar após alguns segundos
    const timer = setTimeout(() => {
      router.push('/');
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Erro na autenticação
          </h2>
          <p className="text-foreground/60 mb-6">
            Houve um problema durante o processo de autenticação com Google. Você será redirecionado automaticamente para a página inicial em alguns segundos.
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  );
}
