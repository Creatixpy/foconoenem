import Link from 'next/link';
import { ArrowRight, BookOpen, Newspaper, PenLine, TrendingUp } from 'lucide-react';

const FEATURES = [
  {
    title: 'Redação com IA',
    description: 'Pratique com temas gerados ou de sua escolha e receba feedback nas cinco competências do ENEM.',
    href: '/redacao',
    action: 'Praticar redação',
    icon: PenLine,
    accent: 'bg-[var(--brand-soft)] text-[var(--brand)]',
  },
  {
    title: 'Questões e simulados',
    description: 'Escolha os conteúdos que quer revisar e aprenda com a correção das respostas.',
    href: '/questoes',
    action: 'Resolver questões',
    icon: BookOpen,
    accent: 'bg-[var(--ai-soft)] text-[var(--ai)]',
  },
  {
    title: 'Seu progresso',
    description: 'Consulte resultados, histórico e estatísticas para identificar o que precisa de mais atenção.',
    href: '/conta',
    action: 'Ver meu progresso',
    icon: TrendingUp,
    accent: 'bg-[var(--success-soft)] text-[var(--success)]',
  },
  {
    title: 'Notícias do ENEM',
    description: 'Acompanhe as novidades do exame e busque informações no acervo de notícias da plataforma.',
    href: '/noticias',
    action: 'Ler notícias',
    icon: Newspaper,
    accent: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  },
] as const;

export default function HomeFeatures() {
  return (
    <section aria-labelledby="home-features-heading" className="border-t border-[var(--border)] py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="home-features-heading" className="text-3xl md:text-4xl">
            Tudo para sua preparação
          </h2>
          <p className="mt-4 text-lg text-[var(--text-3)]">
            Prática, correção e acompanhamento no mesmo lugar.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 md:gap-5">
          {FEATURES.map(({ title, description, href, action, icon: Icon, accent }) => (
            <article key={href} className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 md:p-8">
              <div className={`mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}>
                <Icon size={24} strokeWidth={1.5} aria-hidden="true" />
              </div>
              <h3 className="text-xl">{title}</h3>
              <p className="mb-6 mt-3 flex-1 text-[var(--text-3)]">{description}</p>
              <Link href={href} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-[var(--text-2)] hover:text-[var(--text)]">
                {action}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
