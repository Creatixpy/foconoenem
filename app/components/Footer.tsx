"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  // Garantir que o componente só seja renderizado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <footer className="p-6">
        <div className="container mx-auto">
          {/* Placeholder durante a carga inicial */}
          <div className="h-16"></div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="border-t border-border-color bg-card-bg py-12 mt-auto">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="text-sm font-semibold text-foreground">
              Foco no ENEM
            </p>
            <p className="text-xs text-foreground/60">
              © {new Date().getFullYear()} Todos os direitos reservados.
            </p>
          </div>

          <nav className="flex flex-wrap justify-center gap-6 md:gap-8">
            <Link
              href="/sobre"
              className="text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
            >
              Sobre
            </Link>
            <Link
              href="/privacidade"
              className="text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
            >
              Privacidade
            </Link>
            <Link
              href="/termos"
              className="text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
            >
              Termos
            </Link>
            <Link
              href="/doacao"
              className="text-sm font-medium text-foreground/60 transition-colors hover:text-primary"
            >
              Doação
            </Link>
          </nav>
        </div>
        
        <div className="mt-8 text-center md:text-left">
           <p className="text-xs text-foreground/40">
            Ferramenta de auxílio para estudantes · Não é um site oficial do ENEM ou INEP
          </p>
        </div>
      </div>
    </footer>
  );
}
