"use client";

import Link from "next/link";

interface FooterLink {
  href: string;
  label: string;
}

const footerLinks: FooterLink[] = [
  { href: "/sobre", label: "Sobre" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/termos", label: "Termos" },
  { href: "/doacao", label: "Doação" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="mt-auto border-t border-border-color bg-card-bg"
      role="contentinfo"
    >
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-6 md:flex-row md:justify-between">
          {/* Brand & Copyright */}
          <div className="flex flex-col items-center gap-1.5 md:items-start">
            <p className="text-sm font-semibold text-foreground">
              Foco no ENEM
            </p>
            <p className="text-xs text-foreground/50">
              © {currentYear} Todos os direitos reservados.
            </p>
          </div>

          {/* Navigation Links */}
          <nav
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:gap-x-8"
            aria-label="Links do rodapé"
          >
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/60 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 border-t border-border-color pt-6">
          <p className="text-center text-xs text-foreground/40 md:text-left">
            Ferramenta de auxílio para estudantes · Não é um site oficial do
            ENEM ou INEP
          </p>
        </div>
      </div>
    </footer>
  );
}
