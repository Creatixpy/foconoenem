"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { user, profile, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      // Consider scrolled after 50px
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className={`
      fixed top-0 left-0 right-0 z-50 
      ${isScrolled ? 'bg-gradient-to-r from-blue-700/60 to-blue-900/60 border-2 border-gray-600' : 'bg-gradient-to-r from-blue-700 to-blue-900'} text-white
      transition-all duration-300 ease-in-out
      ${isScrolled
        ? 'py-2 px-4 shadow-sm mx-2 md:mx-[420px] mt-4 rounded-2xl'
        : 'py-4 px-4 shadow-sm'
      }
    `}>
      <div className={`container mx-auto max-w-7xl transition-all duration-300`}>
        {/* Desktop Header */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className={`font-bold flex items-center transition-all duration-300 ${isScrolled ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
              <svg className={`transition-all duration-300 ${isScrolled ? 'w-8 h-8 md:w-10 md:h-10' : 'w-6 h-6 md:w-8 md:h-8'} ${isScrolled ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isScrolled ? 'max-w-xs opacity-100 ml-2' : 'max-w-xs opacity-100 ml-2'}`}>Foco no ENEM</span>
            </h1>
          </Link>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={toggleMobileMenu}
              aria-label="Menu principal"
              className="text-white p-2 focus:outline-none focus:ring-2 focus:ring-white rounded-md"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <ul className={`flex items-center transition-all duration-300 ${isScrolled ? 'space-x-3' : 'space-x-6'}`}>
              <li>
                <Link href="/" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Início</span>
                </Link>
              </li>
              <li>
                <Link href="/redacao" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Redação</span>
                </Link>
              </li>
              <li>
                <Link href="/questoes" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Questões</span>
                </Link>
              </li>
              <li>
                <Link href="/noticias" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Notícias</span>
                </Link>
              </li>
              <li>
                <Link href="/doacao" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-5 h-5 md:w-6 md:h-6' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Apoie</span>
                </Link>
              </li>
              <li className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'block'}`}>
                <div className="flex items-center text-xs bg-black/20 rounded-full px-3 py-1">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  7h às 23h30
                </div>
              </li>
              <li>
                {user ? (
                  <div className="relative">
                    <button
                      onClick={() => setShowUserMenu(!showUserMenu)}
                      className={`flex items-center hover:bg-blue-800 rounded-lg transition-all ${
                        isScrolled ? 'p-1' : 'space-x-2 px-3 py-2'
                      }`}
                      title={isScrolled ? profile?.nome_completo || user.email?.split('@')[0] : ""}
                    >
                      <div className={`bg-blue-400 rounded-full flex items-center justify-center font-bold transition-all ${
                        isScrolled ? 'w-9 h-9 text-base' : 'w-8 h-8 text-sm'
                      }`}>
                        {profile?.nome_completo?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      {!isScrolled && (
                        <span className="text-sm">{profile?.nome_completo || user.email?.split('@')[0]}</span>
                      )}
                    </button>
                    {showUserMenu && (
                      <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 z-50">
                        <Link
                          href="/conta"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setShowUserMenu(false)}
                        >
                          Minha Conta
                        </Link>
                        <button
                          onClick={() => {
                            signOut();
                            setShowUserMenu(false);
                          }}
                          className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          Sair
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/auth/login"
                      className={`flex items-center bg-white text-blue-700 hover:bg-blue-50 rounded-lg transition-all font-medium ${
                        isScrolled 
                          ? 'p-2 justify-center' 
                          : 'px-4 py-2'
                      } ${isScrolled ? '' : 'gap-1'}`}
                      title={isScrolled ? "Entrar" : ""}
                    >
                      <svg className={`transition-all ${isScrolled ? 'w-5 h-5' : 'w-4 h-4'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {!isScrolled && <span className="text-sm">Entrar</span>}
                    </Link>
                    {!isScrolled && (
                      <Link
                        href="/auth/register"
                        className="text-sm font-medium text-white/90 hover:text-white underline-offset-4 hover:underline"
                      >
                        Criar conta
                      </Link>
                    )}
                  </div>
                )}
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <nav className="md:hidden mt-4 pt-4 border-t border-blue-500">
            <ul className="space-y-4 pb-3">
              <li>
                <Link 
                  href="/" 
                  className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Início
                </Link>
              </li>
              <li>
                <Link 
                  href="/redacao" 
                  className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Redação
                </Link>
              </li>
              <li>
                <Link 
                  href="/questoes" 
                  className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  Questões
                </Link>
              </li>
              <li>
                <Link 
                  href="/noticias" 
                  className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  Notícias
                </Link>
              </li>
              <li>
                <Link 
                  href="/doacao" 
                  className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors bg-blue-600/30"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Apoie o Projeto ❤️
                </Link>
              </li>
              <li>
                <div className="flex items-center text-sm bg-black/20 rounded-lg px-3 py-2 mt-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horário de funcionamento: 7h às 23h30
                </div>
              </li>
              <li className="border-t border-blue-500 pt-4 mt-4">
                {user ? (
                  <>
                    <Link
                      href="/conta"
                      className="flex items-center hover:bg-blue-800 py-2 px-3 rounded transition-colors mb-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="w-8 h-8 bg-blue-400 rounded-full flex items-center justify-center text-sm font-bold mr-2">
                        {profile?.nome_completo?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                      </div>
                      {profile?.nome_completo || user.email?.split('@')[0]}
                    </Link>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full hover:bg-red-800 py-2 px-3 rounded transition-colors text-red-300"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sair
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link
                      href="/auth/login"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center w-full bg-white text-blue-700 hover:bg-blue-50 py-2 px-3 rounded transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Entrar
                    </Link>
                    <Link
                      href="/auth/register"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center w-full border border-white/60 text-white hover:bg-blue-800/60 py-2 px-3 rounded transition-colors font-medium"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5s-3 1.343-3 3 1.343 3 3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 19a6 6 0 1112 0H6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11h2m-1-1v2" />
                      </svg>
                      Criar conta
                    </Link>
                  </div>
                )}
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
