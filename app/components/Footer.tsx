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
    <footer className="p-6">
      <div className="container mx-auto">
        <div className="text-center mb-4">
          <p className="text-gray-600 dark:text-gray-300 font-semibold mb-2">
            💙 Criado por alunos, para alunos
          </p>
          <p className="text-gray-600 dark:text-gray-300 text-sm">
            © {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-3">
          <Link href="/sobre" className="text-sm text-gray-500 dark:text-gray-400 hover:underline hover:text-primary">
            Sobre
          </Link>
          <Link href="/privacidade" className="text-sm text-gray-500 dark:text-gray-400 hover:underline hover:text-primary">
            Política de Privacidade
          </Link>
          <Link href="/termos" className="text-sm text-gray-500 dark:text-gray-400 hover:underline hover:text-primary">
            Termos de Serviço
          </Link>
        </div>
        <div className="text-xs text-center text-gray-500 dark:text-gray-400">
          Ferramenta de auxílio para estudantes | Não é um site oficial do ENEM ou INEP
        </div>
      </div>
    </footer>
  );
}
