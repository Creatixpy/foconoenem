import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import AprovIALogo from '@/app/components/shared/AprovIALogo';

export const metadata: Metadata = {
  title: 'Autenticação | AprovIA',
  description: 'Acesse sua conta ou crie uma nova para começar a estudar',
  robots: 'noindex, nofollow',
};

/* Brand feature bullets for the left panel */
const FEATURES = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 20h9" />
        <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
      </svg>
    ),
    text: 'IA que corrige redações',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4 4 4 0 0 0 2.5 3.7V18a4 4 0 0 0 8 0v-3.3A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
        <path d="M12 2v20" />
      </svg>
    ),
    text: 'Simulados personalizados',
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    text: 'Histórico e estatísticas',
  },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh">
      {/* ---- Left brand panel (hidden on mobile) ---- */}
      <div
        className="
          hidden lg:flex lg:w-[480px] xl:w-[520px]
          flex-col justify-between
          p-10 xl:p-12
          relative overflow-hidden shrink-0
        "
        style={{ background: 'var(--auth-panel-bg)' }}
      >
        {/* Decorative gradient blurs */}
        <div className="absolute top-[-10%] right-[-20%] w-[400px] h-[400px] rounded-full blur-[120px]" style={{ background: 'var(--auth-panel-glow-brand)' }} aria-hidden="true" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] h-[300px] rounded-full blur-[100px]" style={{ background: 'var(--auth-panel-glow-ai)' }} aria-hidden="true" />

        {/* Top: Logo */}
        <div className="relative z-10">
          <Link href="/" className="inline-flex transition-transform duration-200 hover:scale-[1.02]" aria-label="AprovIA — Página inicial">
            <AprovIALogo size="lg" />
          </Link>
        </div>

        {/* Middle: Tagline + features */}
        <div className="relative z-10 -mt-8">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight tracking-tight" style={{ color: 'var(--text)' }}>
            Sua preparação para o ENEM começa aqui.
          </h1>
          <p className="mt-4 leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Ferramentas inteligentes, feedback personalizado e acompanhamento contínuo da sua evolução.
          </p>

          <ul className="mt-10 space-y-5">
            {FEATURES.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <span className="flex items-center justify-center w-9 h-9 rounded-lg text-[var(--brand)] shrink-0" style={{ background: 'var(--auth-panel-feature-bg)' }}>
                  {icon}
                </span>
                <span className="font-medium" style={{ color: 'var(--text)' }}>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: Social proof */}
        <p className="relative z-10 text-sm" style={{ color: 'var(--text-3)' }}>
          Usado por centenas de estudantes em todo o Brasil.
        </p>
      </div>

      {/* ---- Right form panel ---- */}
      <div className="flex-1 flex flex-col min-h-dvh bg-[var(--bg)]">
        {/* Mobile logo (lg:hidden) */}
        <div className="lg:hidden flex items-center justify-center pt-8 pb-2">
          <Link href="/" className="inline-flex transition-transform duration-200 hover:scale-[1.02]" aria-label="AprovIA">
            <AprovIALogo size="md" />
          </Link>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
          <div className="w-full max-w-[420px]">
            {children}
          </div>
        </div>

        {/* Bottom legal links */}
        <div className="flex items-center justify-center gap-4 pb-6 text-xs text-[var(--text-3)]">
          <Link href="/privacidade" className="hover:text-[var(--text-2)] transition-colors">Privacidade</Link>
          <span>·</span>
          <Link href="/termos" className="hover:text-[var(--text-2)] transition-colors">Termos de Uso</Link>
        </div>
      </div>
    </div>
  );
}
