'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTheme } from '@/lib/contexts/ThemeContext';
import { useScrollPosition } from '@/lib/hooks/useScrollPosition';
import { useOutsideClick } from '@/lib/hooks/useOutsideClick';

/* ------------------------------------------------------------------ */
/*  Navigation config                                                  */
/* ------------------------------------------------------------------ */
const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/redacao', label: 'Redação' },
  { href: '/questoes', label: 'Questões' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/comunidade', label: 'Comunidade' },
  { href: '/sobre', label: 'Sobre' },
] as const;

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons                                                   */
/* ------------------------------------------------------------------ */
function LogoIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Geometric diamond accent */}
      <rect x="4" y="4" width="20" height="20" rx="4" fill="var(--primary)" opacity="0.15" />
      <rect x="8" y="8" width="12" height="12" rx="2" fill="var(--primary)" />
      <path d="M14 11L17 14L14 17L11 14Z" fill="white" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.93 4.93l1.41 1.41M13.66 13.66l1.41 1.41M4.93 15.07l1.41-1.41M13.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.09 11.05A7 7 0 018.95 2.91 7.5 7.5 0 1017.09 11.05z" />
    </svg>
  );
}

function MenuIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6l4 4 4-4" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: user initials                                              */
/* ------------------------------------------------------------------ */
function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? '?';
}

/* ------------------------------------------------------------------ */
/*  Theme Toggle Button                                                */
/* ------------------------------------------------------------------ */
function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative inline-flex items-center justify-center
        w-9 h-9 rounded-lg
        text-[var(--text-secondary)] hover:text-[var(--text-primary)]
        hover:bg-[var(--bg-elevated)]
        transition-all duration-[var(--duration-fast)]
        ${className ?? ''}
      `}
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <span
        className="inline-flex items-center justify-center transition-transform duration-300"
        style={{ transform: isDark ? 'rotate(0deg)' : 'rotate(180deg)' }}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  User Menu (dropdown)                                               */
/* ------------------------------------------------------------------ */
function UserMenu() {
  const { user, profile, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null!);

  useOutsideClick(menuRef, () => setOpen(false), open);

  const displayName = profile?.nome_completo ?? user?.email?.split('@')[0] ?? 'Usuário';
  const initials = getInitials(profile?.nome_completo ?? user?.email?.split('@')[0]);

  const handleSignOut = useCallback(async () => {
    setOpen(false);
    await signOut();
  }, [signOut]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="
          flex items-center gap-2 rounded-lg px-2 py-1.5
          hover:bg-[var(--bg-elevated)]
          transition-colors duration-[var(--duration-fast)]
        "
        aria-expanded={open}
        aria-haspopup="true"
      >
        {/* Avatar circle */}
        <span className="
          flex items-center justify-center w-8 h-8
          rounded-full bg-[var(--primary)] text-white
          text-xs font-semibold select-none
        ">
          {initials}
        </span>
        <span className="hidden lg:block text-sm font-medium text-[var(--text-primary)] max-w-[120px] truncate">
          {displayName}
        </span>
        <ChevronDownIcon className={`
          hidden lg:block text-[var(--text-muted)]
          transition-transform duration-[var(--duration-fast)]
          ${open ? 'rotate-180' : ''}
        `} />
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="
            absolute right-0 mt-2 w-52
            rounded-xl border border-[var(--border-color)]
            bg-[var(--card-bg)] shadow-lg
            py-1 z-[var(--z-dropdown)]
            animate-[fadeIn_150ms_ease-out]
          "
          role="menu"
        >
          <div className="px-3 py-2 border-b border-[var(--border-color)]">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
            <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
          </div>
          <Link
            href="/conta"
            onClick={() => setOpen(false)}
            className="
              flex items-center px-3 py-2 text-sm text-[var(--text-secondary)]
              hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
              transition-colors duration-[var(--duration-fast)]
            "
            role="menuitem"
          >
            Ver perfil
          </Link>
          <Link
            href="/conta?tab=editar"
            onClick={() => setOpen(false)}
            className="
              flex items-center px-3 py-2 text-sm text-[var(--text-secondary)]
              hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
              transition-colors duration-[var(--duration-fast)]
            "
            role="menuitem"
          >
            Editar perfil
          </Link>
          <div className="border-t border-[var(--border-color)]" />
          <button
            onClick={handleSignOut}
            className="
              w-full flex items-center px-3 py-2 text-sm
              text-[var(--danger)] hover:bg-[var(--danger-light)]
              transition-colors duration-[var(--duration-fast)]
            "
            role="menuitem"
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */
export default function Header() {
  const { user, loading } = useAuth();
  const { isScrolled } = useScrollPosition(8);
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null!);

  useOutsideClick(mobileMenuRef, () => setMobileOpen(false), mobileOpen);

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
    <header
      className={`
        sticky top-0 z-[var(--z-sticky)]
        transition-all duration-[var(--duration-normal)]
        ${isScrolled
          ? 'bg-[var(--bg-base)]/80 backdrop-blur-xl border-b border-[var(--border-color)] shadow-sm'
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      <nav className="container flex items-center justify-between h-16" aria-label="Navegação principal">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 group"
          aria-label="Foco no ENEM — Página inicial"
        >
          <LogoIcon className="transition-transform duration-[var(--duration-normal)] group-hover:scale-105" />
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Foco no <span className="text-[var(--primary)]">ENEM</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <ul className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                className={`
                  relative px-3 py-2 text-sm font-medium rounded-lg
                  transition-colors duration-[var(--duration-fast)]
                  ${isActive(href)
                    ? 'text-[var(--primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                  }
                `}
              >
                {label}
                {/* Active indicator */}
                {isActive(href) && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-[var(--primary)] rounded-full" />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop Right Side */}
        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />

          {!loading && (
            <>
              {user ? (
                <UserMenu />
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="
                      px-4 py-2 text-sm font-medium rounded-lg
                      text-[var(--text-secondary)] hover:text-[var(--text-primary)]
                      hover:bg-[var(--bg-elevated)]
                      transition-colors duration-[var(--duration-fast)]
                    "
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="
                      px-4 py-2 text-sm font-medium rounded-lg
                      bg-[var(--primary)] text-white
                      hover:bg-[var(--primary-hover)]
                      active:bg-[var(--primary-active)]
                      transition-colors duration-[var(--duration-fast)]
                      shadow-sm
                    "
                  >
                    Começar grátis
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="
              inline-flex items-center justify-center w-10 h-10
              rounded-lg text-[var(--text-secondary)]
              hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]
              transition-colors duration-[var(--duration-fast)]
            "
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
          >
            <span className="transition-transform duration-[var(--duration-normal)]">
              {mobileOpen ? <CloseIcon /> : <MenuIcon />}
            </span>
          </button>
        </div>
      </nav>
    </header>

      {/* ---- Mobile Menu (outside header to avoid backdrop-filter containing block) ---- */}
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 z-[calc(var(--z-sticky)-1)] bg-black/50 backdrop-blur-sm
          md:hidden
          transition-opacity duration-[var(--duration-normal)]
          ${mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={mobileMenuRef}
        className={`
          fixed top-0 right-0 bottom-0 z-[var(--z-sticky)]
          w-[min(320px,85vw)]
          bg-[var(--bg-base)] border-l border-[var(--border-color)]
          md:hidden
          transition-transform duration-[var(--duration-normal)] ease-[var(--ease-out)]
          ${mobileOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        {/* Mobile menu header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-[var(--border-color)]">
          <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            Menu
          </span>
          <button
            onClick={() => setMobileOpen(false)}
            className="
              inline-flex items-center justify-center w-9 h-9
              rounded-lg text-[var(--text-secondary)]
              hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]
              transition-colors duration-[var(--duration-fast)]
            "
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Mobile nav links */}
        <div className="flex flex-col p-4 gap-1 overflow-y-auto" style={{ maxHeight: 'calc(100dvh - 4rem)' }}>
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`
                flex items-center px-3 py-3 rounded-lg text-base font-medium
                transition-colors duration-[var(--duration-fast)]
                ${isActive(href)
                  ? 'text-[var(--primary)] bg-[var(--primary-light)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                }
              `}
            >
              {label}
            </Link>
          ))}

          {/* Divider */}
          <div className="my-3 border-t border-[var(--border-color)]" />

          {/* Theme toggle row */}
          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-[var(--text-secondary)]">Tema</span>
            <ThemeToggle />
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-[var(--border-color)]" />

          {/* Auth actions */}
          {!loading && (
            <>
              {user ? (
                <MobileUserSection />
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/login"
                    className="
                      flex items-center justify-center px-4 py-3
                      rounded-lg text-sm font-medium
                      text-[var(--text-secondary)] border border-[var(--border-color)]
                      hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
                      transition-colors duration-[var(--duration-fast)]
                    "
                  >
                    Entrar
                  </Link>
                  <Link
                    href="/register"
                    className="
                      flex items-center justify-center px-4 py-3
                      rounded-lg text-sm font-medium
                      bg-[var(--primary)] text-white
                      hover:bg-[var(--primary-hover)]
                      transition-colors duration-[var(--duration-fast)]
                    "
                  >
                    Começar grátis
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Mobile User Section                                                */
/* ------------------------------------------------------------------ */
function MobileUserSection() {
  const { user, profile, signOut } = useAuth();

  const displayName = profile?.nome_completo ?? user?.email?.split('@')[0] ?? 'Usuário';
  const initials = getInitials(profile?.nome_completo ?? user?.email?.split('@')[0]);

  return (
    <div className="flex flex-col gap-1">
      {/* User info */}
      <div className="flex items-center gap-3 px-3 py-2 mb-2">
        <span className="
          flex items-center justify-center w-10 h-10
          rounded-full bg-[var(--primary)] text-white
          text-sm font-semibold select-none shrink-0
        ">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">{displayName}</p>
          <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
        </div>
      </div>

      <Link
        href="/conta"
        className="
          flex items-center px-3 py-3 rounded-lg text-sm font-medium
          text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]
          transition-colors duration-[var(--duration-fast)]
        "
      >
        Ver perfil
      </Link>
      <Link
        href="/conta?tab=editar"
        className="
          flex items-center px-3 py-3 rounded-lg text-sm font-medium
          text-[var(--text-secondary)]
          hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]
          transition-colors duration-[var(--duration-fast)]
        "
      >
        Editar perfil
      </Link>
      <button
        onClick={signOut}
        className="
          flex items-center px-3 py-3 rounded-lg text-sm font-medium
          text-[var(--danger)]
          hover:bg-[var(--danger-light)]
          transition-colors duration-[var(--duration-fast)]
          w-full text-left
        "
      >
        Sair
      </button>
    </div>
  );
}
