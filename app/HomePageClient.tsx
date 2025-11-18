'use client';

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "./contexts/AuthContext";
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

export default function HomePageClient() {
  const { user } = useAuth();
  return (
    <main className="flex-grow">
      <section
        id="home-hero"
        className="relative overflow-hidden px-4 pb-24 pt-20 sm:px-6 lg:px-8 lg:pt-32"
        aria-labelledby="home-hero-heading home-hero-description"
      >
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute -top-[30%] -left-[10%] w-[70%] h-[70%] rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-accent/5 blur-3xl" />
          </div>

          <div className="container relative z-10 mx-auto grid max-w-7xl gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-2 rounded-full bg-secondary/80 backdrop-blur-sm px-3 py-1 text-sm font-medium text-foreground/80 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Aberto 7h — 23h30 (BRT)
              </div>
              <div className="space-y-6">
                <h1
                  id="home-hero-heading"
                  className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl lg:text-7xl"
                >
                  Transforme estudo em <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">resultado</span>.
                </h1>
                <p
                  id="home-hero-description"
                  className="max-w-2xl text-lg leading-relaxed text-foreground/60 sm:text-xl"
                >
                  Correção rápida, simulados sob medida e alertas curtos para estudar só o que importa.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                <Link href="/redacao" className="btn btn-primary text-base px-8 py-3">
                  Começar pela redação
                </Link>
                <Link href="/questoes" className="btn btn-secondary gap-2 text-base px-8 py-3">
                  Explorar simulados
                  <svg className="h-5 w-5 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
              
              <dl className="grid gap-8 sm:grid-cols-3 pt-8 border-t border-border-color">
                {heroStats.map((stat) => (
                  <div key={stat.label}>
                    <dd className="text-3xl font-bold text-foreground">{stat.value}</dd>
                    <dt className="text-sm font-medium text-foreground/50 mt-1">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>

            <div className="relative isolate hidden lg:block">
              <div className="relative z-10 space-y-6">
                <div className="card p-6 bg-white/80 backdrop-blur-md border-0">
                  <div className="flex items-center justify-between text-sm text-foreground/60">
                    <span className="inline-flex items-center gap-2 font-medium text-foreground">
                      <span className="h-2 w-2 rounded-full bg-success" />
                      Correção instantânea
                    </span>
                    <span>Agora</span>
                  </div>
                  <div className="mt-6 space-y-4">
                    <div className="rounded-xl bg-secondary/50 p-4">
                      <div className="flex items-center justify-between text-sm text-foreground/70">
                        <span>Competência 1</span>
                        <span className="font-semibold text-foreground">200 / 200</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-success shadow-[0_0_10px_rgba(16,185,129,0.3)]" style={{ width: "100%" }} />
                      </div>
                    </div>

                    <div className="rounded-xl bg-secondary/50 p-4">
                      <div className="flex items-center justify-between text-sm text-foreground/70">
                        <span>Competência 2</span>
                        <span className="font-semibold text-foreground">180 / 200</span>
                      </div>
                      <div className="mt-3 h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]" style={{ width: "90%" }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-6 translate-x-8 bg-white/80 backdrop-blur-md border-0">
                  <h3 className="text-lg font-semibold">Simulado rápido</h3>
                  <p className="mt-2 text-sm text-foreground/60">
                    Matemática · Linguagens · Ciências Humanas
                  </p>
                  <div className="mt-5 grid gap-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground/60">Progresso</span>
                      <span className="font-semibold text-foreground">12/15</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800">
                        <div className="h-full rounded-full bg-accent shadow-[0_0_10px_rgba(139,92,246,0.3)]" style={{ width: "80%" }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="recursos"
          className="relative px-4 pb-20 sm:px-6 lg:px-8"
          aria-labelledby="home-recursos-heading"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="space-y-4 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/5 px-4 py-1 text-sm font-semibold text-primary">
                Recursos completos para estudar com confiança
              </p>
              <h2 id="home-recursos-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Tudo que você precisa em um só lugar
              </h2>
              <p className="mx-auto max-w-3xl text-base text-foreground/60">
                Organizamos a sua preparação com ferramentas inteligentes, painéis intuitivos e uma experiência que parece feita
                sob medida para o seu ritmo de estudos.
              </p>
            </div>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {highlights.map((highlight) => (
                <article key={highlight.title} className="card p-6 hover:bg-secondary/30 border-0">
                  <div className="flex items-start gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {highlight.icon}
                    </span>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">{highlight.title}</h3>
                      <p className="text-base text-foreground/60 leading-relaxed">{highlight.description}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          id="metodologia"
          className="relative px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="home-metodologia-heading"
        >
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-secondary/30 to-transparent" />
          <div className="container mx-auto max-w-6xl">
            <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:items-center">
              <div className="space-y-8">
                <div className="space-y-4">
                  <p className="inline-flex items-center gap-2 rounded-full bg-accent/5 px-3 py-1 text-sm font-medium text-accent">
                    Metodologia em 3 etapas
                  </p>
                  <h2 id="home-metodologia-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    Prepare-se com fluxo rápido e claro
                  </h2>
                  <p className="text-lg text-foreground/60 leading-relaxed">
                    Desenhamos uma jornada que equilibra a prática constante com relatórios acionáveis. Avance pelos passos e use o
                    painel para transformar feedbacks em uma rotina que cabe na sua agenda.
                  </p>
                </div>
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
                  <div key={step.number} className="card p-6 sm:p-8 border-0 hover:bg-white/50">
                    <span className="text-sm font-bold tracking-wider text-primary/80 uppercase">{step.number}</span>
                    <h3 className="mt-2 text-xl font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-base text-foreground/60">{step.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          id="historias"
          className="relative px-4 py-24 sm:px-6 lg:px-8"
          aria-labelledby="home-historias-heading"
        >
          <div className="container mx-auto max-w-6xl">
            <div className="space-y-4 text-center mb-16">
              <p className="inline-flex items-center gap-2 rounded-full bg-success/5 px-3 py-1 text-sm font-medium text-success">
                Histórias reais de evolução
              </p>
              <h2 id="home-historias-heading" className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Quem já está construindo resultados
              </h2>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {testimonials.map((testimonial) => (
                <figure key={testimonial.author} className="card p-8 border-0 bg-secondary/20">
                  <blockquote className="text-base leading-relaxed text-foreground/60 italic">
                    “{testimonial.quote}”
                  </blockquote>
                  <figcaption className="mt-6 border-t border-border-color pt-4">
                    <p className="font-semibold text-foreground">{testimonial.author}</p>
                    <p className="text-sm text-foreground/50">{testimonial.role}</p>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {user && (
          <section
            className="relative px-4 py-24 sm:px-6 lg:px-8"
            aria-labelledby="home-comunidade-heading"
          >
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-secondary/30 to-transparent" />
            <div className="container mx-auto max-w-5xl space-y-4 text-center">
              <p className="inline-flex items-center gap-2 rounded-full bg-accent/5 px-3 py-1 text-sm font-medium text-accent">
                Comunidade exclusiva
              </p>
              <h2 id="home-comunidade-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                Converse com quem também está no ENEM
              </h2>
              <p className="mx-auto max-w-3xl text-base text-foreground/60">
                Participe dos fóruns privados para trocar estratégias de redação, revisar simulados em grupo e manter a
                motivação. Nossa equipe modera todos os tópicos para evitar plágios e garantir um ambiente colaborativo.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2">
              <div className="card p-6 border-0">
                <h3 className="text-xl font-semibold text-foreground">Fóruns por tema</h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Discuta repertórios, compartilhe repertórios confiáveis e receba feedback em tópicos moderados por quem
                  entende do ENEM.
                </p>
              </div>
              <div className="card p-6 border-0">
                <h3 className="text-xl font-semibold text-foreground">Eventos da comunidade</h3>
                <p className="mt-2 text-sm text-foreground/60">
                  Encontros semanais com dicas de planejamento, desafios de redação e mentorias rápidas para manter o foco.
                </p>
              </div>
            </div>
            <div className="mt-8 flex justify-center">
                <Link href="/comunidade" className="btn btn-primary">
                  Acessar fórum privado
                </Link>
            </div>
          </section>
        )}

        <section
          id="cta-final"
          className="relative px-4 pb-24 sm:px-6 lg:px-8"
          aria-labelledby="home-cta-heading"
        >
          <div className="container mx-auto max-w-5xl">
            <div className="card p-10 text-center border-0 bg-gradient-to-br from-card-bg to-secondary/50">
              <div className="space-y-6">
                <h2 id="home-cta-heading" className="text-3xl font-semibold text-foreground sm:text-4xl">
                  Vamos conquistar a redação mil juntos?
                </h2>
                <p className="mx-auto max-w-2xl text-base text-foreground/60">
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
                    className="btn btn-outline gap-2 px-8 py-3 text-base font-semibold text-primary"
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
