'use client';

import { startTransition, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useTheme } from '@/lib/contexts/ThemeContext';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/redacao', label: 'Redação' },
  { href: '/questoes', label: 'Questões' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/sobre', label: 'Sobre' },
] as const;

const supabase = createClient();

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="Foco no ENEM — Página inicial">
      <svg
        className="transition-transform duration-[var(--duration-normal)] group-hover:scale-105"
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        aria-hidden="true"
      >
        <rect x="4" y="4" width="20" height="20" rx="4" fill="var(--primary)" opacity="0.15" />
        <rect x="8" y="8" width="12" height="12" rx="2" fill="var(--primary)" />
        <path d="M14 11L17 14L14 17L11 14Z" fill="white" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
        Foco no <span className="text-[var(--primary)]">ENEM</span>
      </span>
    </Link>
  );
}

function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      {isDark ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17.09 11.05A7 7 0 018.95 2.91 7.5 7.5 0 1017.09 11.05z" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="3.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
        </svg>
      )}
    </button>
  );
}

function AuthActions({
  user,
  compact = false,
  onAction,
}: {
  user: User | null;
  compact?: boolean;
  onAction?: () => void;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const displayName = useMemo(() => {
    if (!user) {
      return null;
    }

    const metadataName =
      typeof user.user_metadata?.nome_completo === 'string'
        ? user.user_metadata.nome_completo
        : typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : null;

    return metadataName || user.email?.split('@')[0] || 'Minha conta';
  }, [user]);

  const handleSignOut = async () => {
    onAction?.();
    setSubmitting(true);
    try {
      await supabase.auth.signOut();
      startTransition(() => {
        router.refresh();
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className={`flex items-center ${compact ? 'flex-col gap-2' : 'gap-2'}`}>
        <Link
          href="/login"
          onClick={onAction}
          className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          onClick={onAction}
          className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--primary-hover)]"
        >
          Começar grátis
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${compact ? 'flex-col items-stretch gap-2' : 'gap-2'}`}>
      <Link
        href="/conta"
        onClick={onAction}
        className="rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-elevated)]"
      >
        {compact ? 'Minha conta' : displayName}
      </Link>
      <button
        type="button"
        onClick={handleSignOut}
        disabled={submitting}
        className="rounded-lg border border-[var(--border-color)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? 'Saindo...' : 'Sair'}
      </button>
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const closeMobileMenu = () => {
    setMobileOpen(false);
  };

  useEffect(() => {
    let mounted = true;

    const syncUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(currentUser ?? null);
      }
    };

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';

    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-[var(--z-sticky)] border-b transition-all duration-[var(--duration-normal)] ${
        isScrolled
          ? 'border-[var(--border-color)] bg-[var(--bg-base)]/90 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-[var(--bg-base)]/70'
      }`}
    >
      <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Navegação principal">
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActivePath(pathname, href)
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          <ThemeToggle />
          <AuthActions user={user} />
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => {
              setMobileOpen((current) => !current);
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div className="border-t border-[var(--border-color)] bg-[var(--bg-base)] md:hidden">
          <div className="container flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  className={`rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    isActivePath(pathname, href)
                      ? 'bg-[var(--primary-light)] text-[var(--primary)]'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="my-2 border-t border-[var(--border-color)]" />
            <AuthActions user={user} compact onAction={closeMobileMenu} />
          </div>
        </div>
      )}
    </header>
  );
}
