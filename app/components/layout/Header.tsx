'use client';

import { startTransition, useEffect, useId, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import AprovIALogo from '@/app/components/shared/AprovIALogo';
import { clearUserDrafts } from '@/lib/client/drafts';
import { CreditCard, History, LogOut, UserRound } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/redacao', label: 'Redação' },
  { href: '/questoes', label: 'Questões' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/planos', label: 'Planos' },
  { href: '/sobre', label: 'Sobre' },
] as const;

const supabase = createClient();
const ACCOUNT_LINKS = [
  { href: '/conta/editar', label: 'Perfil', Icon: UserRound },
  { href: '/conta?aba=redacoes', label: 'Histórico de redações', Icon: History },
  { href: '/conta#plano', label: 'Plano', Icon: CreditCard },
] as const;

function isActivePath(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/';
  }

  return pathname.startsWith(href);
}

function Logo() {
  return (
    <Link href="/" className="shrink-0 transition-transform duration-[var(--duration-normal)] hover:scale-[1.02]" aria-label="AprovIA — Página inicial">
      <AprovIALogo size="md" />
    </Link>
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
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const closeMenu = () => {
    setOpen(false);
    onAction?.();
  };

  const handleSignOut = async () => {
    closeMenu();
    setSubmitting(true);
    try {
      if (user) clearUserDrafts(user.id);
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
          className="inline-flex min-h-12 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          Entrar
        </Link>
        <Link
          href="/register"
          onClick={onAction}
          className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
        >
          Começar grátis
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          if (!open) onAction?.();
          setOpen((current) => !current);
        }}
        disabled={submitting}
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`Menu da conta de ${displayName}`}
        className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--brand)]/40 bg-[var(--brand-soft)] text-sm font-semibold text-[var(--text)] transition-colors hover:border-[var(--brand-hover)] hover:bg-[var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span aria-hidden="true">{displayName?.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase()}</span>
      </button>
      {open && (
        <nav id={menuId} aria-label="Menu da conta" className="absolute right-0 top-full z-10 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-xl border border-[var(--border)] bg-[var(--surface)] p-2 shadow-xl">
          <p className="break-words border-b border-[var(--border)] px-3 py-3 text-sm font-semibold text-[var(--text)]">{displayName}</p>
          <ul className="mt-1">
            {ACCOUNT_LINKS.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link href={href} onClick={closeMenu} className="flex min-h-12 items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]">
                  <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            ))}
            <li className="mt-1 border-t border-[var(--border)] pt-1">
              <button type="button" onClick={handleSignOut} disabled={submitting} className="flex min-h-12 w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] disabled:opacity-60">
                <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
                {submitting ? 'Saindo…' : 'Sair'}
              </button>
            </li>
          </ul>
        </nav>
      )}
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
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted) {
        setUser(session?.user ?? null);
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
    if (!mobileOpen) return;

    const desktopViewport = window.matchMedia('(min-width: 64rem)');
    const onViewportChange = (event: MediaQueryListEvent) => {
      if (event.matches) setMobileOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileOpen(false);
        document.getElementById('mobile-navigation-toggle')?.focus();
      }
    };

    desktopViewport.addEventListener('change', onViewportChange);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      desktopViewport.removeEventListener('change', onViewportChange);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  return (
    <header
      className={`sticky top-0 z-[var(--z-sticky)] border-b transition-all duration-[var(--duration-normal)] ${
        isScrolled
          ? 'border-[var(--border)] bg-[var(--bg)]/90 shadow-sm backdrop-blur-xl'
          : 'border-transparent bg-[var(--bg)]/70'
      }`}
    >
      <nav className="container flex h-16 items-center justify-between gap-4" aria-label="Navegação principal">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={isActivePath(pathname, href) ? 'page' : undefined}
                className={`inline-flex min-h-12 items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActivePath(pathname, href)
                    ? 'text-[var(--brand-hover)]'
                    : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                }`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <AuthActions key={user?.id ?? 'guest'} user={user} />
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          {user && <AuthActions key={user.id} user={user} onAction={closeMobileMenu} />}
          <button
            id="mobile-navigation-toggle"
            type="button"
            onClick={() => {
              setMobileOpen((current) => !current);
            }}
            className="inline-flex h-12 w-12 items-center justify-center rounded-lg text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? (
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {mobileOpen && (
        <div id="mobile-navigation" className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-[var(--border)] bg-[var(--bg)] lg:hidden">
          <div className="container flex flex-col gap-3 py-4">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={closeMobileMenu}
                  aria-current={isActivePath(pathname, href) ? 'page' : undefined}
                  className={`flex min-h-12 items-center rounded-lg px-3 py-3 text-base font-medium transition-colors ${
                    isActivePath(pathname, href)
                      ? 'bg-[var(--brand-soft)] text-[var(--text)]'
                      : 'text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
            <div className="my-2 border-t border-[var(--border)]" />
            {!user && <AuthActions user={null} compact onAction={closeMobileMenu} />}
          </div>
        </div>
      )}
    </header>
  );
}
