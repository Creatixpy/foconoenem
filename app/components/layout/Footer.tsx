import Link from "next/link";
import Image from "next/image";

interface FooterLink {
    href: string;
    label: string;
}

const resourceLinks: FooterLink[] = [
    { href: "/redacao", label: "Redação" },
    { href: "/questoes", label: "Questões" },
    { href: "/noticias", label: "Notícias" },
    { href: "/comunidade", label: "Comunidade" },
];

const supportLinks: FooterLink[] = [
    { href: "/sobre", label: "Sobre" },
    { href: "/privacidade", label: "Privacidade" },
    { href: "/termos", label: "Termos de Uso" },
    { href: "/doacao", label: "Apoie o projeto" },
];

export default function Footer() {
    return (
        <footer
            className="mt-auto border-t border-border-color bg-card-bg"
            role="contentinfo"
        >
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Brand */}
                    <div className="sm:col-span-2 lg:col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2.5 mb-4">
                            <span className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <Image
                                    src="/foconoenemicon.png"
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="brightness-0 invert"
                                    aria-hidden="true"
                                />
                            </span>
                            <span className="text-lg font-bold text-foreground">
                                Foco no <span className="text-primary">ENEM</span>
                            </span>
                        </Link>
                        <p className="max-w-sm text-sm leading-relaxed text-foreground/60">
                            Sua plataforma completa para preparação do ENEM.
                            Redações corrigidas por IA, banco de questões e uma
                            comunidade engajada para te levar à aprovação.
                        </p>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">
                            Recursos
                        </h3>
                        <ul className="space-y-3">
                            {resourceLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground/60 transition-colors hover:text-primary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="mb-4 text-sm font-semibold text-foreground">
                            Suporte
                        </h3>
                        <ul className="space-y-3">
                            {supportLinks.map((link) => (
                                <li key={link.href}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-foreground/60 transition-colors hover:text-primary"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border-color pt-8 sm:flex-row">
                    <p className="text-xs text-foreground/40">
                        © {new Date().getFullYear()} Foco no ENEM. Todos os direitos reservados.
                    </p>
                    <p className="text-xs text-foreground/40">
                        Feito com ❤️ para estudantes de todo o Brasil.
                    </p>
                </div>
            </div>
        </footer>
    );
}
