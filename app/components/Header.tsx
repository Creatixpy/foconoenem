"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

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
      bg-gradient-to-r from-blue-700 to-blue-900 text-white 
      transition-all duration-300 ease-in-out
      ${isScrolled
        ? 'py-2 px-4 shadow-lg mx-8 mt-4 rounded-2xl'
        : 'py-4 px-4 shadow-md'
      }
    `}>
      <div className={`container mx-auto max-w-7xl transition-all duration-300`}>
        {/* Desktop Header */}
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <h1 className={`font-bold flex items-center transition-all duration-300 ${isScrolled ? 'text-xl md:text-2xl' : 'text-2xl md:text-3xl'}`}>
              <svg className={`transition-all duration-300 ${isScrolled ? 'w-6 h-6 md:w-7 md:h-7' : 'w-6 h-6 md:w-8 md:h-8'} ${isScrolled ? '' : 'mr-2'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              <span className={`whitespace-nowrap transition-all duration-300 overflow-hidden ${isScrolled ? 'max-w-0 opacity-0 ml-0' : 'max-w-xs opacity-100 ml-2'}`}>Foco no ENEM</span>
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
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Início</span>
                </Link>
              </li>
              <li>
                <Link href="/redacao" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Redação</span>
                </Link>
              </li>
              <li>
                <Link href="/questoes" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Questões</span>
                </Link>
              </li>
              <li>
                <Link href="/noticias" className={`hover:text-blue-200 transition-all duration-300 flex items-center ${isScrolled ? 'text-sm' : ''}`}>
                  <svg className={`transition-all duration-300 ${isScrolled ? 'w-4 h-4' : 'w-4 h-4'} mr-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                  </svg>
                  <span className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'inline'}`}>Notícias</span>
                </Link>
              </li>
              <li className={`transition-all duration-300 ${isScrolled ? 'hidden' : 'block'}`}>
                <div className="flex items-center text-xs bg-black/20 rounded-full px-3 py-1">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  7h às 22h
                </div>
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
                <div className="flex items-center text-sm bg-black/20 rounded-lg px-3 py-2 mt-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Horário de funcionamento: 7h às 22h
                </div>
              </li>
            </ul>
          </nav>
        )}
      </div>
    </header>
  );
}
