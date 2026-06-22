import Link from 'next/link';
import CookiePreferencesButton from '@/app/components/privacy/CookiePreferencesButton';
import AprovIALogo from '@/app/components/shared/AprovIALogo';

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
];

const SUPORTE = [
  { href: '/sobre', label: 'Sobre' },
  { href: '/privacidade', label: 'Privacidade' },
  { href: '/termos', label: 'Termos de Uso' },
  { href: '/doacao', label: 'Apoie o projeto' },
];

const SOCIAL = [
  { href: 'https://github.com/Creatixpy', label: 'GitHub', Icon: GitHubIcon },
  { href: 'mailto:creatixpy@gmail.com', label: 'E-mail', Icon: MailIcon },
];

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */
export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)]">
      {/* Main grid */}
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Column 1 — Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 group">
              <AprovIALogo size="sm" />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[var(--text-3)] max-w-[260px]">
              Sua plataforma de estudos para o ENEM com simulados personalizados, correção de redação por IA e muito mais.
            </p>
          </div>

          {/* Column 2 — Recursos */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Recursos</h3>
            <ul className="flex flex-col gap-3">
              {RECURSOS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="
                      text-sm text-[var(--text-3)]
                      hover:text-[var(--text)]
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
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Suporte</h3>
            <ul className="flex flex-col gap-3">
              {SUPORTE.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="
                      text-sm text-[var(--text-3)]
                      hover:text-[var(--text)]
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
            <h3 className="text-sm font-semibold text-[var(--text)] mb-4">Conecte-se</h3>
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="
                    inline-flex items-center justify-center w-9 h-9
                    rounded-lg text-[var(--text-3)]
                    hover:text-[var(--text)] hover:bg-[var(--surface-2)]
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
      <div className="border-t border-[var(--border)]">
        <div className="container flex flex-col sm:flex-row items-center justify-between py-5 gap-3 text-sm text-[var(--text-3)]">
          <p>© {currentYear} AprovIA. Todos os direitos reservados.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <CookiePreferencesButton className="text-sm text-[var(--text-3)] transition-colors hover:text-[var(--text)]" />
            <span aria-hidden="true" className="hidden sm:inline">•</span>
            <p>Feito com ❤️ para estudantes do Brasil</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
