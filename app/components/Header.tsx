"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

const navLinks = [
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

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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

  const brandInitial = useMemo(() => {
    if (profile?.nome_completo) {
      return profile.nome_completo.trim().charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() ?? "F";
  }, [profile?.nome_completo, user?.email]);

  const linkTone = isScrolled ? "text-foreground/70 hover:text-primary" : "text-foreground/80 hover:text-primary";
  const headerSurface = isScrolled ? "header-surface header-surface--scrolled" : "header-surface header-surface--top";

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${headerSurface}`}>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 transition-transform hover:scale-[1.01]">
          <span className={`brand-badge ${isScrolled ? "brand-badge--scrolled" : "brand-badge--top"}`}>
            <Image
              src="/foconoenemicon.png"
              alt="Logotipo Foco no ENEM"
              width={28}
              height={28}
              priority
            />
          </span>
          <span className="hidden text-lg font-semibold tracking-tight text-foreground sm:inline">
            Foco no ENEM
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex" aria-label="Navegação principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${linkTone} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <div className="relative">
              <button
                type="button"
                className={`user-chip ${isScrolled ? "user-chip--scrolled" : "user-chip--top"}`}
                onClick={() => setShowUserMenu((previous) => !previous)}
                aria-haspopup="true"
                aria-expanded={showUserMenu}
              >
                <span className="user-chip__avatar">{brandInitial}</span>
                <span className="hidden sm:block text-foreground">
                  {profile?.nome_completo ?? user.email?.split("@")[0]}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-52 overflow-hidden rounded-2xl border border-border-color/60 bg-card-bg shadow-xl">
                  <Link
                    href="/conta"
                    className="block px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted-bg"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Minha conta
                  </Link>
                  <button
                    type="button"
                    onClick={async () => {
                      await signOut();
                      setShowUserMenu(false);
                    }}
                    className="block w-full px-4 py-3 text-left text-sm font-medium text-danger transition-colors hover:bg-danger-light/40"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className={`hidden items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors md:inline-flex ${
                  isScrolled ? "text-foreground/80 hover:text-primary" : "text-primary hover:text-primary-dark"
                }`}
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-all shadow-md ${
                  isScrolled
                    ? "bg-primary text-white hover:bg-primary-dark"
                    : "bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg"
                }`}
              >
                Criar conta
              </Link>
            </>
          )}

          <button
            type="button"
            className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border transition-all md:hidden ${
              isScrolled ? "border-border-color/70 text-foreground" : "border-border-color/40 text-foreground"
            }`}
            onClick={() => setMobileMenuOpen((previous) => !previous)}
            aria-label={mobileMenuOpen ? "Fechar menu de navegação" : "Abrir menu de navegação"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {mobileMenuOpen ? (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16m-7 6h7" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-border-color/60 bg-card-bg/95 px-4 pb-6 pt-4 shadow-xl backdrop-blur md:hidden" id="mobile-navigation">
          <nav className="space-y-1" aria-label="Navegação mobile">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {link.label}
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            ))}
          </nav>

          {!user && (
            <div className="mt-6 space-y-3">
              <Link
                href="/auth/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-2xl border border-border-color/70 px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted-bg"
              >
                Entrar
              </Link>
              <Link
                href="/auth/register"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Criar conta gratuita
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
