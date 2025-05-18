"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export default function Footer() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="p-6">
      <div className="container mx-auto">
        <div className="text-center mb-4">
          <p className="text-gray-600 dark:text-gray-300">
            © {mounted ? new Date().getFullYear() : "2024"} Foco no ENEM - Todos os direitos reservados
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
      </div>
    </footer>
  );
}
