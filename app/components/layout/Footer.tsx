import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Inline SVG Icons (social)                                          */
/* ------------------------------------------------------------------ */
function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer Data                                                        */
/* ------------------------------------------------------------------ */
const RECURSOS = [
  { href: '/redacao', label: 'Redação' },
  { href: '/questoes', label: 'Questões' },
  { href: '/noticias', label: 'Notícias' },
  { href: '/comunidade', label: 'Comunidade' },
];

const SUPORTE = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/doacao', label: 'Apoie o projeto' },
];

const SOCIAL = [
  { href: 'https://github.com/Creatixpy/foconoenem', label: 'GitHub', Icon: GitHubIcon },
  { href: 'https://x.com/foconoenem', label: 'X (Twitter)', Icon: XTwitterIcon },
  { href: 'https://instagram.com/foconoenem', label: 'Instagram', Icon: InstagramIcon },
  { href: 'mailto:contato@foconoenem.com', label: 'E-mail', Icon: MailIcon },
];

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border-color)] bg-[var(--bg-surface)]">
      {/* Main grid */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                aria-hidden="true"
              >
                <rect x="4" y="4" width="20" height="20" rx="4" fill="var(--primary)" opacity="0.15" />
                <rect x="8" y="8" width="12" height="12" rx="2" fill="var(--primary)" />
                <path d="M14 11L17 14L14 17L11 14Z" fill="white" />
              </svg>
              <span className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
                Foco no <span className="text-[var(--primary)]">ENEM</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)] max-w-[260px]">
              Sua plataforma de estudos para o ENEM com simulados personalizados, correção de redação por IA e muito mais.
            </p>
          </div>

          {/* Column 2 — Recursos */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Recursos</h3>
            <ul className="flex flex-col gap-3">
              {RECURSOS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="
                      text-sm text-[var(--text-muted)]
                      hover:text-[var(--text-primary)]
                      transition-colors duration-[var(--duration-fast)]
                    "
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3 — Suporte */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Suporte</h3>
            <ul className="flex flex-col gap-3">
              {SUPORTE.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="
                      text-sm text-[var(--text-muted)]
                      hover:text-[var(--text-primary)]
                      transition-colors duration-[var(--duration-fast)]
                    "
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4 — Social */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Conecte-se</h3>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="
                    inline-flex items-center justify-center w-9 h-9
                    rounded-lg text-[var(--text-muted)]
                    hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]
                    transition-colors duration-[var(--duration-fast)]
                  "
                  aria-label={label}
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[var(--border-color)]">
        <div className="container flex flex-col sm:flex-row items-center justify-between py-5 gap-3 text-sm text-[var(--text-muted)]">
          <p>© {currentYear} Foco no ENEM. Todos os direitos reservados.</p>
          <p>Feito com ❤️ para estudantes do Brasil</p>
        </div>
      </div>
    </footer>
  );
}
