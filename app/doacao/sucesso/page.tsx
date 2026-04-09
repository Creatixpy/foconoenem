'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function DoacaoSucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carregamento para melhor UX
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <div className="text-center">
          <div className="inline-block h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-primary mb-4" />
          <p className="text-lg text-foreground opacity-70">Confirmando sua doação...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow bg-gradient-to-br from-background via-background to-muted-bg">
      <div className="container mx-auto max-w-4xl p-4 md:p-8">
        <div className="card card-gradient p-8 md:p-12 text-center animate-fadeIn">
          {/* Ícone de sucesso animado */}
          <div className="mb-6 inline-block">
            <div className="relative">
              <div className="absolute inset-0 bg-success/20 rounded-full animate-ping"></div>
              <div className="relative bg-success/10 p-6 rounded-full">
                <svg
                  className="w-16 h-16 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Doação Realizada com Sucesso! 🎉
          </h1>
          
          <p className="text-lg text-foreground opacity-90 mb-6 max-w-2xl mx-auto">
            Muito obrigado por apoiar o Foco no ENEM! Sua contribuição é fundamental 
            para mantermos o projeto gratuito e ajudando milhares de estudantes a 
            alcançarem seus sonhos.
          </p>

          {sessionId && (
            <div className="mb-8 p-4 bg-muted-bg/50 rounded-lg inline-block">
              <p className="text-sm text-foreground opacity-70 mb-1">ID da transação:</p>
              <p className="text-xs font-mono text-primary break-all">{sessionId}</p>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-6 mb-8 text-left">
            <div className="card card-interactive p-6">
              <div className="text-3xl mb-3">💚</div>
              <h3 className="text-lg font-semibold mb-2">Impacto Real</h3>
              <p className="text-sm opacity-80">
                Sua doação ajuda a manter os servidores, IA e desenvolvimento ativo
              </p>
            </div>
            <div className="card card-interactive p-6">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="text-lg font-semibold mb-2">Confirmação</h3>
              <p className="text-sm opacity-80">
                Você receberá um recibo por email do Stripe
              </p>
            </div>
            <div className="card card-interactive p-6">
              <div className="text-3xl mb-3">🙏</div>
              <h3 className="text-lg font-semibold mb-2">Gratidão</h3>
              <p className="text-sm opacity-80">
                Seu apoio faz toda a diferença para os estudantes
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/"
              className="btn btn-primary btn-lg inline-flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Voltar para a Página Inicial
            </Link>
            <Link
              href="/questoes"
              className="btn btn-secondary btn-lg inline-flex items-center justify-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Fazer um Simulado
            </Link>
          </div>

          {/* Informação adicional */}
          <div className="mt-8 pt-8 border-t border-muted-border">
            <p className="text-sm text-foreground opacity-70">
              Dúvidas ou problemas? Entre em contato através da nossa{' '}
              <Link href="/" className="text-primary hover:underline">
                página principal
              </Link>
              .
            </p>
          </div>
        </div>

        {/* Compartilhar */}
        <div className="card card-gradient p-6 mt-6 text-center">
          <h2 className="text-xl font-semibold mb-3">Ajude mais estudantes!</h2>
          <p className="text-sm opacity-80 mb-4">
            Compartilhe o Foco no ENEM com seus amigos e ajude mais pessoas a se prepararem para o exame.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Acabei de apoiar o Foco no ENEM! Uma plataforma incrível para estudar para o ENEM 🎓 Confira: ')}&url=${encodeURIComponent('https://foconoenem.com.br')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              Compartilhar no X
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent('Confira o Foco no ENEM - Uma plataforma gratuita para estudar para o ENEM! https://foconoenem.com.br')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary btn-sm"
            >
              Compartilhar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function DoacaoSucessoPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
          <div className="text-center">
            <div className="inline-block h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-primary mb-4" />
            <p className="text-lg text-foreground opacity-70">Carregando...</p>
          </div>
        </main>
      }
    >
      <DoacaoSucessoContent />
    </Suspense>
  );
}
