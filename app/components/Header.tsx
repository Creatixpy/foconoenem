"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthContext";

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
  const { user, profile, signOut } = useAuth();

  // Handle scroll state
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 16);
    };

    // Initial check
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-user-menu]")) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const brandInitial = useMemo(() => {
    if (profile?.nome_completo) {
      return profile.nome_completo.trim().charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() ?? "U";
  }, [profile?.nome_completo, user?.email]);

  const displayName = useMemo(() => {
    if (profile?.nome_completo) {
      return profile.nome_completo.split(" ")[0];
    }
    return user?.email?.split("@")[0] ?? "Usuário";
  }, [profile?.nome_completo, user?.email]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  }, [signOut]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  // Dynamic classes based on scroll state
  const headerSurfaceClass = isScrolled
    ? "header-surface header-surface--scrolled"
    : "header-surface header-surface--top";

  const linkClass = isScrolled
    ? "text-foreground/70 hover:text-primary"
    : "text-foreground/80 hover:text-primary";

  const brandBadgeClass = isScrolled
    ? "brand-badge brand-badge--scrolled"
    : "brand-badge brand-badge--top";

  const userChipClass = isScrolled
    ? "user-chip user-chip--scrolled"
    : "user-chip user-chip--top";

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerSurfaceClass}`}
        role="banner"
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2.5 transition-transform hover:scale-[1.01] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
            aria-label="Foco no ENEM - Página inicial"
          >
            <span className={brandBadgeClass}>
              <Image
                src="/foconoenemicon.png"
                alt=""
                width={28}
                height={28}
                priority
                aria-hidden="true"
              />
            </span>
            <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">
              Foco no ENEM
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${linkClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  className={userChipClass}
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-label="Menu do usuário"
                >
                  <span className="user-chip__avatar" aria-hidden="true">
                    {brandInitial}
                  </span>
                  <span className="hidden text-sm sm:block">
                    {displayName}
                  </span>
                  <svg
                    className={`hidden h-4 w-4 transition-transform sm:block ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                {showUserMenu && (
                  <div
                    className="absolute right-0 mt-2 w-56 origin-top-right animate-fadeIn rounded-xl border border-border-color bg-card-bg shadow-xl"
                    role="menu"
                    aria-orientation="vertical"
                  >
                    <div className="p-1">
                      <Link
                        href="/conta"
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Minha conta
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-danger"
                        role="menuitem"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                        </svg>
                        Sair
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden items-center gap-2 sm:flex">
                <Link
                  href="/auth/login"
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    isScrolled
                      ? "text-foreground/80 hover:text-primary"
                      : "text-foreground hover:text-primary"
                  } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  className="inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-dark hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                >
                  Criar conta
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden ${
                isScrolled
                  ? "bg-muted-bg text-foreground hover:bg-muted-bg/80"
                  : "bg-white/20 text-foreground backdrop-blur-sm hover:bg-white/30"
              } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={
                mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"
              }
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16m-7 6h7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div
            id="mobile-navigation"
            className="border-t border-border-color bg-card-bg/98 px-4 pb-6 pt-4 shadow-xl backdrop-blur-lg md:hidden"
            role="navigation"
            aria-label="Navegação mobile"
          >
            <nav className="space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  {link.label}
                  <svg
                    className="h-4 w-4 text-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Buttons */}
            {!user && (
              <div className="mt-6 space-y-3">
                <Link
                  href="/auth/login"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-xl bg-muted-bg px-4 py-3 text-base font-semibold text-foreground transition-colors hover:bg-muted-bg/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                >
                  Entrar
                </Link>
                <Link
                  href="/auth/register"
                  onClick={closeMobileMenu}
                  className="flex items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50"
                >
                  Criar conta gratuita
                </Link>
              </div>
            )}

            {/* Mobile User Menu */}
            {user && (
              <div className="mt-6 border-t border-border-color pt-4">
                <div className="mb-4 flex items-center gap-3 px-4">
                  <span className="user-chip__avatar text-sm" aria-hidden="true">
                    {brandInitial}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {displayName}
                    </p>
                    <p className="text-xs text-foreground/60">{user.email}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <Link
                    href="/conta"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Minha conta
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base font-medium text-danger transition-colors hover:bg-danger-light/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-danger"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sair
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Mobile menu backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm md:hidden"
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}
    </>
  );
}
