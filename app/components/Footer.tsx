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
    <footer className="px-4 pb-12 pt-10">
      <div className="mx-auto max-w-6xl">
        <div className="footer-surface overflow-hidden rounded-[2rem] border border-border-color/60 p-8 text-center shadow-xl backdrop-blur">
          <div className="space-y-3">
            <p className="text-base font-semibold text-foreground/80">
              💙 Criado por alunos, para alunos
            </p>
            <p className="text-sm text-foreground/60">
              © {new Date().getFullYear()} Foco no ENEM — Todos os direitos reservados
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-4 md:gap-6">
            <Link
              href="/sobre"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              Sobre
            </Link>
            <Link
              href="/privacidade"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              Política de Privacidade
            </Link>
            <Link
              href="/termos"
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-primary"
            >
              Termos de Serviço
            </Link>
          </div>

          <p className="mt-6 text-xs text-foreground/50">
            Ferramenta de auxílio para estudantes · Não é um site oficial do ENEM ou INEP
          </p>
        </div>
      </div>
    </footer>
  );
}
