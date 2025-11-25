/**
 * Auth Layout
 * Minimalist, isolated layout for authentication pages
 * Uses the same theme system as the main app
 */

import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Autenticação | Foco no ENEM',
  description: 'Acesse sua conta ou crie uma nova para começar a estudar',
  robots: 'noindex, nofollow',
};

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background gradient - uses theme colors */}
      <div
        className="fixed inset-0 pointer-events-none -z-10"
        style={{
          background: `
            radial-gradient(ellipse 80% 50% at 50% 0%, var(--color-primary-100), transparent 50%),
            radial-gradient(ellipse 60% 40% at 80% 100%, var(--color-accent-100), transparent 40%)
          `,
          opacity: 0.5,
        }}
      />

      {/* Subtle pattern overlay */}
      <div
        className="fixed inset-0 opacity-[0.015] pointer-events-none -z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative min-h-screen flex flex-col">
        {/* Header with logo */}
        <header className="py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5 text-xl font-bold text-foreground transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            >
              <span
                className="flex items-center justify-center w-9 h-9 rounded-lg text-lg"
                style={{ background: 'var(--primary-light)' }}
                aria-hidden="true"
              >
                📚
              </span>
              <span>Foco no ENEM</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 sm:px-6 border-t border-border-color">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-foreground/50">
              © {currentYear} Foco no ENEM. Todos os direitos reservados.
            </p>
            <nav className="mt-2 flex items-center justify-center gap-4 text-xs text-foreground/40">
              <Link
                href="/privacidade"
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                Privacidade
              </Link>
              <span aria-hidden="true">•</span>
              <Link
                href="/termos"
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded"
              >
                Termos
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </div>
  );
}
