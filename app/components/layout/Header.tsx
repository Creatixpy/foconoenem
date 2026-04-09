"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth/context";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/redacao", label: "Redação" },
  { href: "/questoes", label: "Questões" },
  { href: "/noticias", label: "Notícias" },
  { href: "/comunidade", label: "Comunidade" },
  { href: "/sobre", label: "Sobre" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const pathname = usePathname();
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserMenu]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setShowUserMenu(false);
  }, [pathname]);

  const displayInitial = useMemo(() => {
    if (profile?.nome_completo) return profile.nome_completo.trim().charAt(0).toUpperCase();
    return user?.email?.charAt(0).toUpperCase() ?? "U";
  }, [profile?.nome_completo, user?.email]);

  const displayName = useMemo(() => {
    if (profile?.nome_completo) return profile.nome_completo.split(" ")[0];
    return user?.email?.split("@")[0] ?? "Estudante";
  }, [profile?.nome_completo, user?.email]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  }, [signOut]);

  const closeMobileMenu = useCallback(() => setMobileMenuOpen(false), []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`header-surface ${isScrolled ? "header-surface--scrolled" : ""}`}
      role="banner"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Foco no ENEM — Página inicial"
        >
          <span className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <Image
              src="/foconoenemicon.png"
              alt=""
              width={22}
              height={22}
              className="brightness-0 invert"
              priority
              aria-hidden="true"
            />
          </span>
          <span className="hidden text-base font-bold text-foreground sm:inline">
            Foco no <span className="text-primary">ENEM</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-foreground/70 hover:bg-muted-bg hover:text-foreground"
              }`}
              {...(isActive(link.href) ? { "aria-current": "page" as const } : {})}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="flex items-center gap-3">
          {authLoading ? (
            <div className="hidden h-9 w-24 animate-pulse rounded-lg bg-muted-bg sm:block" />
          ) : user ? (
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                className="flex items-center gap-2 rounded-full border border-border-color bg-card-bg px-3 py-1.5 text-sm transition-colors hover:bg-muted-bg"
                onClick={() => setShowUserMenu((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={showUserMenu}
                aria-label="Menu do usuário"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                  {displayInitial}
                </span>
                <span className="hidden max-w-[100px] truncate font-medium sm:block">
                  {displayName}
                </span>
                <svg
                  className={`hidden h-4 w-4 text-foreground/50 transition-transform sm:block ${showUserMenu ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* User Dropdown */}
              <div
                className={`absolute right-0 mt-2 w-52 origin-top-right rounded-xl border border-border-color bg-card-bg p-1.5 shadow-lg transition-all duration-150 ${
                  showUserMenu
                    ? "scale-100 opacity-100"
                    : "pointer-events-none scale-95 opacity-0"
                }`}
                style={{ zIndex: 'var(--z-dropdown)' }}
                role="menu"
              >
                <Link
                  href="/conta"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-foreground transition-colors hover:bg-muted-bg"
                  onClick={() => setShowUserMenu(false)}
                  role="menuitem"
                >
                  <svg className="h-4 w-4 text-foreground/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Meu Perfil
                </Link>
                <div className="my-1 border-t border-border-color" />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleSignOut(); }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm text-danger transition-colors hover:bg-danger/10"
                  role="menuitem"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sair
                </button>
              </div>
            </div>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted-bg hover:text-foreground">
                Entrar
              </Link>
              <Link href="/register" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-dark">
                Criar conta
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-muted-bg hover:text-foreground md:hidden"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          mobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ zIndex: 'var(--z-overlay)' }}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* Mobile Menu Panel */}
      <div
        className={`fixed inset-y-0 right-0 w-[80%] max-w-sm border-l border-border-color bg-card-bg shadow-xl transition-transform duration-300 ease-out md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ zIndex: 'var(--z-mobile-menu)' }}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navegação"
      >
        <div className="flex h-full flex-col overflow-y-auto p-6">
          <div className="mb-8 flex items-center justify-between">
            <span className="text-lg font-bold text-foreground">Menu</span>
            <button
              onClick={closeMobileMenu}
              className="rounded-lg p-2 text-foreground/70 transition-colors hover:bg-muted-bg hover:text-foreground"
              aria-label="Fechar menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-1" aria-label="Navegação mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobileMenu}
                className={`block rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary/10 text-primary"
                    : "text-foreground/70 hover:bg-muted-bg hover:text-foreground"
                }`}
                {...(isActive(link.href) ? { "aria-current": "page" as const } : {})}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile Auth */}
          <div className="mt-auto border-t border-border-color pt-6">
            {authLoading ? (
              <div className="h-10 animate-pulse rounded-lg bg-muted-bg" />
            ) : user ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 px-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                    {displayInitial}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName}</p>
                    <p className="truncate text-xs text-foreground/50">{user.email}</p>
                  </div>
                </div>
                <Link
                  href="/conta"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center rounded-lg border border-border-color px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted-bg"
                >
                  Meu Perfil
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
                >
                  Sair
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center rounded-lg border border-border-color px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted-bg"
                >
                  Entrar
                </Link>
                <Link
                  href="/register"
                  onClick={closeMobileMenu}
                  className="flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Criar conta
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
