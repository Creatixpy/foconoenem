/**
 * Auth Layout
 * Minimalist, isolated layout for authentication pages
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
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Subtle background pattern */}
      <div 
        className="fixed inset-0 opacity-[0.02] pointer-events-none"
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
              className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
            >
              <span className="text-2xl">📚</span>
              <span>Foco no ENEM</span>
            </Link>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="py-6 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              © {new Date().getFullYear()} Foco no ENEM. Todos os direitos reservados.
            </p>
            <div className="mt-2 flex items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <a href="/privacidade" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Privacidade
              </a>
              <span>•</span>
              <a href="/termos" className="hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Termos
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
