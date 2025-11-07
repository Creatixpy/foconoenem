import Link from "next/link";
import type { ReactNode } from "react";
import AccountLinkButton from "./components/AccountLinkButton";

type Highlight = {
  title: string;
  description: string;
  icon: ReactNode;
};

type Step = {
  number: string;
  title: string;
  description: string;
};

type Testimonial = {
  author: string;
  role: string;
  quote: string;
};

const heroStats = [
  { value: "8,5k+", label: "Redações corrigidas" },
  { value: "1,2k+", label: "Questões atualizadas" },
  { value: "88%", label: "Aumento médio na nota" },
];

const highlights: Highlight[] = [
  {
    title: "Correção com inteligência artificial",
    description: "Aplicamos os 5 critérios oficiais e resumimos o que fazer a seguir.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    title: "Simulados dinâmicos por disciplina",
    description: "Monte blocos rápidos com as matérias que mais precisa revisar.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9.75 17L9 20l-1 .75M14.25 17l.75 3 1 .75M7 4h10m-9 4h8m-9 4h5"
        />
      </svg>
    ),
  },
  {
    title: "Dashboard com evolução em tempo real",
    description: "Notas, acertos por disciplina e alertas em um painel compacto.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M11 3.055A9 9 0 1012 21v-7m0 0l4 4m-4-4l-4 4"
        />
      </svg>
    ),
  },
  {
    title: "Conteúdo curado e notícias do ENEM",
    description: "Alertas curtos sobre prazos, temas e mudanças oficiais.",
    icon: (
      <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 6l7 4.03-7 3.97-7-3.97L12 6zm0 8v6m-7-4v-6m14 6v-6"
        />
      </svg>
    ),
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "Escolha seu desafio",
    description: "Selecione redação, simulado ou questões rápidas.",
  },
  {
    number: "02",
    title: "Pratique com foco",
    description: "Use editor limpo, textos de apoio e feedback imediato.",
  },
  {
    number: "03",
    title: "Receba insights acionáveis",
    description: "Veja onde perdeu pontos e ajuste o próximo estudo.",
  },
];

const testimonials: Testimonial[] = [
  {
    author: "Gabriela Santos",
    role: "Estudante aprovada em Medicina",
    quote: "Transformei feedbacks curtos em metas reais e subi de 720 para 960.",
  },
  {
    author: "Diego Moraes",
    role: "Professor de cursinho pré-vestibular",
    quote: "Uso as estatísticas para decidir rapidamente o que revisar em aula.",
  },
  {
    author: "Larissa Monteiro",
    role: "Estudante treineira",
    quote: "As notificações curtas me deixam atualizada sem quebrar o foco.",
  },
];

export function generateMetadata() {
  return {
    title: "Foco no ENEM - Simulados personalizados e redações com IA",
    description:
      "Construa sua rotina de estudos com simulados adaptados, correção de redação e insights para cada competência do ENEM.",
  };
}

export default function Home() {
  return (
    <main className="flex-grow">
      <section className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-28">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-10">
              <div className="hero-status shadow-glow">
                <span className="h-2 w-2 rounded-full bg-success" />
                Aberto 7h — 23h30 (BRT)
              </div>
              <div className="space-y-6">
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl">
                  Transforme estudo em resultado no ENEM.
                </h1>
                <p className="max-w-2xl text-lg leading-relaxed text-foreground/75 sm:text-xl">
                  Correção rápida, simulados sob medida e alertas curtos para estudar só o que importa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <Link href="/redacao" className="btn btn-primary px-8 py-3 text-base">
                  Começar pela redação
                </Link>
                <Link href="/questoes" className="btn btn-glass gap-2 px-8 py-3 text-base font-semibold text-primary">
                  Explorar simulados
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              <nav className="space-y-3" aria-label="Atalhos da página">
                <p className="text-sm font-semibold text-foreground/70">Acesse rápido:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { href: "#recursos", label: "Recursos" },
                    { href: "#metodologia", label: "Metodologia" },
                    { href: "#historias", label: "Histórias" },
                    { href: "#cta-final", label: "Convite final" },
                  ].map((anchor) => (
                    <a
                      key={anchor.href}
                      href={anchor.href}
                      className="rounded-full border border-border-color/60 px-4 py-2 text-sm font-semibold text-foreground/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    >
                      {anchor.label}
                    </a>
                  ))}
                </div>
                <a
                  href="#metodologia"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  Rolagem rápida
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 9l-7 7-7-7" />
                  </svg>
                </a>
              </nav>
              <dl className="grid gap-4 sm:grid-cols-3">
                {heroStats.map((stat) => (
                  <div key={stat.label} className="stat-card px-5 py-4">
                    <dt className="text-sm uppercase tracking-wide text-foreground/70">{stat.label}</dt>
                    <dd className="mt-2 text-2xl font-semibold">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative isolate">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/40 blur-3xl" aria-hidden />
              <div className="glass-panel relative z-10 space-y-6">
                <div className="surface-card p-6 text-foreground shadow-xl">
                  <div className="flex items-center justify-between text-sm text-foreground/70">
                    <span className="inline-flex items-center gap-2 font-medium">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Correção instantânea
                    </span>
                    <span>Atualizado em tempo real</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-2xl bg-success/10 p-4 text-foreground shadow-inner">
                      <div className="flex items-center justify-between text-sm text-foreground/70">
                        <span>Competência 1</span>
                        <span className="font-semibold text-success">200 / 200</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-success/20">
                        <div className="h-full rounded-full bg-success" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-primary/10 p-4 text-foreground shadow-inner">
                      <div className="flex items-center justify-between text-sm text-foreground/70">
                        <span>Competência 2</span>
                        <span className="font-semibold text-primary">180 / 200</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-primary/20">
                        <div className="h-full rounded-full bg-primary" style={{ width: "90%" }} />
                      </div>
                    </div>

                    <div className="rounded-2xl bg-accent/10 p-4 text-foreground shadow-inner">
                      <div className="flex items-center justify-between text-sm text-foreground/70">
                        <span>Competência 3</span>
                        <span className="font-semibold text-accent">160 / 200</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-accent/20">
                        <div className="h-full rounded-full bg-accent" style={{ width: "80%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="surface-card p-6 text-foreground shadow-xl">
                  <h3 className="text-lg font-semibold">Simulado rápido</h3>
                  <p className="mt-2 text-sm text-foreground/70">
                    Matemática · Linguagens · Ciências Humanas · Atualidades do ENEM 2024
                  </p>
                  <div className="mt-5 grid gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-foreground/65">
                        <span className="h-2 w-2 rounded-full bg-success" />
                        Questões respondidas
                      </span>
                      <span className="font-semibold text-foreground">12/15</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="inline-flex items-center gap-2 text-foreground/65">
                        <span className="h-2 w-2 rounded-full bg-warning" />
                        Tempo restante
                      </span>
                      <span className="font-semibold text-foreground">08:46</span>
                    </div>
                    <Link
                      href="/questoes"
                      className="mt-4 inline-flex items-center justify-center gap-2 rounded-2xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary shadow-inner transition-colors hover:bg-primary/20"
                    >
                      Continuar simulado
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="recursos" className="relative px-4 pb-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="space-y-4 text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                Recursos completos para estudar com confiança
              </p>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="mx-auto max-w-3xl text-base text-foreground/70">
                Organizamos a sua preparação com ferramentas inteligentes, painéis intuitivos e uma experiência que parece feita
                sob medida para o seu ritmo de estudos.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {highlights.map((highlight) => (
                <article key={highlight.title} className="glass-card border border-border-color/60 bg-card-bg/70 p-6">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
                      {highlight.icon}
                    </span>
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-foreground">{highlight.title}</h3>
                      <p className="text-base text-foreground/70">{highlight.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="metodologia" className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div className="space-y-6">
                <p className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-sm font-semibold text-accent">
                  Metodologia em 3 etapas
                </p>
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  Prepare-se com fluxo rápido e claro
                </h2>
                <p className="text-base text-foreground/70">
                  Desenhamos uma jornada que equilibra a prática constante com relatórios acionáveis. Avance pelos passos e use o
                  painel para transformar feedbacks em uma rotina que cabe na sua agenda.
                </p>
                <Link
                  href="/sobre"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  Conheça os bastidores do projeto
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>

              <div className="grid gap-4">
                {steps.map((step) => (
                  <div key={step.number} className="glass-card border border-border-color/60 bg-card-bg/80 p-6 sm:p-8">
                    <span className="text-2xl font-semibold text-primary">{step.number}</span>
                    <h3 className="mt-4 text-2xl font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-3 text-base text-foreground/70">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="historias" className="relative px-4 py-20 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl">
            <div className="space-y-4 text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-1 text-sm font-semibold text-success">
                Histórias reais de evolução
              </p>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Quem já está construindo resultados
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.author} className="testimonial-card glass-card border border-border-color/50 bg-card-bg/80 p-6">
                  <blockquote className="text-base leading-relaxed text-foreground/80">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-6 space-y-1">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-foreground/60">{testimonial.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        <section id="cta-final" className="relative px-4 pb-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-5xl">
            <div className="gradient-border cta-surface overflow-hidden rounded-[2.75rem] p-10 text-center shadow-2xl backdrop-blur">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  Vamos conquistar a redação mil juntos?
                </h2>
                <p className="mx-auto max-w-2xl text-base text-foreground/70">
                  Teste gratuitamente, acompanhe sua evolução e descubra o plano ideal para chegar na nota que você merece.
                  Estudar pode ser leve quando você enxerga cada avanço.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <AccountLinkButton
                    className="btn btn-primary px-8 py-3 text-base"
                    loggedInLabel="Acessar minha conta"
                  />
                  <Link
                    href="/noticias"
                    className="btn btn-glass gap-2 px-8 py-3 text-base font-semibold text-primary"
                  >
                    Ver novidades do ENEM
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
    </main>
  );
}
