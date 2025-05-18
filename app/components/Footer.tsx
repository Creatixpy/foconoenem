"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  // Garantir que o componente só seja renderizado no cliente
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sempre retornar um elemento JSX válido, mesmo antes de montar
  return (
    <footer className="p-6">
      <div className="container mx-auto">
        {mounted ? (
          <>
            <div className="text-center mb-4">
              <p className="text-gray-600 dark:text-gray-300">
                © {new Date().getFullYear()} Foco no ENEM - Todos os direitos reservados
              </p>
            </div>
            <div className="flex justify-center space-x-6 mb-3">
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
          </>
        ) : (
          // Placeholder durante a carga inicial
          <div className="h-16"></div>
        )}
      </div>
    </footer>
  );
}
