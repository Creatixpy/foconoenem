"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/context";
import { motion, AnimatePresence } from "motion/react";

interface NavLink {
  href: string;
  label: string;
}

const navLinks: NavLink[] = [
  { href: "/", label: "INÍCIO" },
  { href: "/redacao", label: "REDAÇÃO" },
  { href: "/questoes", label: "QUESTÕES" },
  { href: "/noticias", label: "NOTÍCIAS" },
  { href: "/comunidade", label: "COMUNIDADE" },
  { href: "/sobre", label: "SOBRE" },
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
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on escape key
  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-user-menu]")) setShowUserMenu(false);
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
    return user?.email?.charAt(0).toUpperCase() ?? "P1";
  }, [profile?.nome_completo, user?.email]);

  const displayName = useMemo(() => {
    if (profile?.nome_completo) {
      return profile.nome_completo.split(" ")[0];
    }
    return user?.email?.split("@")[0] ?? "ESTUDANTE";
  }, [profile?.nome_completo, user?.email]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    setShowUserMenu(false);
    setMobileMenuOpen(false);
  }, [signOut]);

  const closeMobileMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <>
      <header
        className={`header-surface ${isScrolled ? "header-surface--scrolled" : "border-transparent"}`}
        role="banner"
      >
        <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
            aria-label="Foco no ENEM - Página inicial"
          >
            <span className="relative flex h-10 w-10 items-center justify-center border-2 border-foreground bg-primary shadow-[4px_4px_0px_var(--foreground)]">
              <Image
                src="/foconoenemicon.png"
                alt=""
                width={24}
                height={24}
                className="pixelated"
                priority
                aria-hidden="true"
              />
            </span>
            <span className="hidden text-sm md:text-base font-pixel text-foreground sm:inline leading-tight">
              FOCO NO<br/><span className="text-primary">ENEM</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden items-center gap-2 md:flex"
            aria-label="Navegação principal"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-xs font-pixel text-foreground/80 transition-all hover:text-primary hover:bg-muted-bg border-2 border-transparent hover:border-foreground hover:shadow-[2px_2px_0px_var(--foreground)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="relative" data-user-menu>
                <button
                  type="button"
                  className="user-chip"
                  onClick={() => setShowUserMenu((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={showUserMenu}
                  aria-label="Menu do usuário"
                >
                  <span className="user-chip__avatar">
                    {brandInitial}
                  </span>
                  <span className="hidden max-w-[100px] truncate sm:block font-pixel text-[10px]">
                    {displayName}
                  </span>
                  <svg
                    className={`hidden h-3 w-3 ml-1 text-foreground transition-transform sm:block ${showUserMenu ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* User Dropdown Menu */}
                <AnimatePresence>
                  {showUserMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute right-0 mt-4 w-56 origin-top-right border-2 border-foreground bg-card-bg shadow-[6px_6px_0px_var(--foreground)] p-2 z-50"
                      role="menu"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Link
                        href="/conta"
                        className="flex items-center gap-3 px-3 py-2 text-xs font-pixel text-foreground hover:bg-primary hover:text-white transition-colors border border-transparent hover:border-foreground"
                        onClick={() => setShowUserMenu(false)}
                        role="menuitem"
                      >
                        👤 MEU PERFIL
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOut();
                        }}
                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-xs font-pixel text-danger hover:bg-danger hover:text-white transition-colors border border-transparent hover:border-foreground"
                        role="menuitem"
                      >
                        💀 SAIR
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden items-center gap-3 sm:flex">
                <Link
                  href="/login"
                  className="btn btn-outline text-[10px]"
                >
                  ENTRAR
                </Link>
                <Link
                  href="/register"
                  className="btn btn-primary text-[10px]"
                >
                  CADASTRAR
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center border-2 border-foreground bg-card-bg text-foreground transition-all hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[2px_2px_0px_var(--foreground)] md:hidden"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Menu"
            >
              {mobileMenuOpen ? (
                <span className="font-pixel text-xl">X</span>
              ) : (
                <span className="font-pixel text-xl">≡</span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Overlay */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                    onClick={closeMobileMenu}
                    aria-hidden="true"
                />
                <motion.div
                    id="mobile-navigation"
                    initial={{ x: "100%" }}
                    animate={{ x: 0 }}
                    exit={{ x: "100%" }}
                    transition={{ type: "tween", duration: 0.3 }}
                    className="fixed inset-y-0 right-0 z-50 w-[80%] max-w-sm border-l-4 border-foreground bg-card-bg p-6 shadow-2xl md:hidden overflow-y-auto"
                >
                    <div className="flex items-center justify-between mb-8 border-b-2 border-foreground pb-4">
                        <span className="text-lg font-pixel text-primary">MENU</span>
                        <button
                            onClick={closeMobileMenu}
                            className="p-2 text-foreground hover:bg-muted-bg border-2 border-transparent hover:border-foreground transition-all"
                        >
                            <span className="font-pixel">FECHAR</span>
                        </button>
                    </div>

                    <nav className="space-y-4">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeMobileMenu}
                                className="block border-2 border-foreground p-3 text-sm font-pixel text-foreground hover:bg-primary hover:text-white hover:shadow-[4px_4px_0px_var(--foreground)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Mobile Auth Buttons */}
                    {!user && (
                        <div className="mt-8 space-y-4">
                            <Link
                                href="/login"
                                onClick={closeMobileMenu}
                                className="btn btn-outline w-full justify-center"
                            >
                                ENTRAR
                            </Link>
                            <Link
                                href="/register"
                                onClick={closeMobileMenu}
                                className="btn btn-primary w-full justify-center"
                            >
                                CADASTRAR
                            </Link>
                        </div>
                    )}

                    {/* Mobile User Menu */}
                    {user && (
                        <div className="mt-8 border-t-2 border-foreground pt-6">
                            <div className="mb-6 flex items-center gap-4 px-2">
                                <div className="flex h-12 w-12 items-center justify-center border-2 border-foreground bg-primary text-white font-pixel text-xl shadow-[2px_2px_0px_var(--foreground)]">
                                    {brandInitial}
                                </div>
                                <div>
                                    <p className="font-pixel text-xs text-foreground uppercase">
                                        {displayName}
                                    </p>
                                    <p className="text-xs font-mono text-foreground/60">{user.email}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <Link
                                    href="/conta"
                                    onClick={closeMobileMenu}
                                    className="btn btn-glass w-full justify-start"
                                >
                                    👤 MEUS DADOS
                                </Link>
                                <button
                                    type="button"
                                    onClick={handleSignOut}
                                    className="btn btn-outline w-full justify-start text-danger border-danger hover:bg-danger hover:text-white"
                                >
                                    💀 SAIR
                                </button>
                            </div>
                        </div>
                    )}
                </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
