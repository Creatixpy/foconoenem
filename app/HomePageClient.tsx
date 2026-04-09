'use client';

import Link from "next/link";
import { AccountLinkButton } from "./components/ui";

interface Feature {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
}

interface Step {
  number: string;
  title: string;
  description: string;
}

interface Testimonial {
  author: string;
  role: string;
  quote: string;
}

const features: Feature[] = [
  {
    title: "Redação com IA",
    description:
      "Escreva redações e receba correção detalhada baseada nas 5 competências oficiais do ENEM, com feedback instantâneo.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      </svg>
    ),
    href: "/redacao",
  },
  {
    title: "Banco de Questões",
    description:
      "Pratique com questões organizadas por disciplina, assunto e nível de dificuldade. Simulados rápidos ou completos.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    ),
    href: "/questoes",
  },
  {
    title: "Notícias do ENEM",
    description:
      "Fique por dentro de prazos, mudanças nas regras e dicas atualizadas sobre o exame. Tudo em um só lugar.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5" />
      </svg>
    ),
    href: "/noticias",
  },
  {
    title: "Comunidade",
    description:
      "Conecte-se com outros estudantes, tire dúvidas, compartilhe dicas e mantenha a motivação durante a preparação.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    href: "/comunidade",
  },
];

const steps: Step[] = [
  {
    number: "01",
    title: "Escolha sua atividade",
    description:
      "Redação, simulado completo ou questões rápidas — você decide o que estudar hoje.",
  },
  {
    number: "02",
    title: "Pratique e receba feedback",
    description:
      "Use nosso editor de redação ou responda questões e receba correção detalhada na hora.",
  },
  {
    number: "03",
    title: "Acompanhe sua evolução",
    description:
      "Analise seus resultados, identifique pontos fracos e melhore sua nota a cada tentativa.",
  },
];

const testimonials: Testimonial[] = [
  {
    author: "Gabriela S.",
    role: "Estudante de Medicina",
    quote:
      "A correção por IA me ajudou a entender exatamente onde eu errava nas competências. Minha nota subiu de 720 para 960!",
  },
  {
    author: "Diego M.",
    role: "Professor",
    quote:
      "Uso o painel de estatísticas para identificar as maiores dificuldades dos meus alunos e focar nas aulas certas.",
  },
  {
    author: "Larissa M.",
    role: "Vestibulanda",
    quote:
      "As notícias me mantêm atualizada sobre prazos e mudanças sem precisar ficar caçando informação em vários sites.",
  },
];

export default function HomePageClient() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-background px-4 py-20 lg:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="container relative z-10 mx-auto max-w-5xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            Plataforma gratuita
          </div>

          <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            Prepare-se para o{" "}
            <span className="text-primary">ENEM</span>{" "}
            com inteligência artificial
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-foreground/70">
            Redações corrigidas por IA, banco de questões, simulados
            personalizados e uma comunidade ativa. Tudo que você precisa
            para alcançar sua melhor nota.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <AccountLinkButton
              className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg"
              loggedInLabel="Ir para o painel"
              loggedOutLabel="Começar gratuitamente"
            />
            <Link
              href="/sobre"
              className="inline-flex items-center justify-center rounded-xl border border-border-color bg-card-bg px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted-bg"
            >
              Saiba mais
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border-color bg-muted-bg/30 px-4 py-20 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Tudo para sua preparação
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-foreground/60">
              Ferramentas completas e integradas para você estudar de forma
              eficiente e alcançar seus objetivos.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            {features.map((feature) => (
              <Link
                key={feature.title}
                href={feature.href}
                className="group rounded-2xl border border-border-color bg-card-bg p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/30"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-foreground/60">
                  {feature.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="border-t border-border-color bg-background px-4 py-20 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Como funciona
              </h2>
              <p className="mt-4 text-lg text-foreground/60">
                Três passos simples para começar a evoluir nos estudos.
                Sem complicação, sem custo.
              </p>
              <Link
                href="/sobre"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary-dark"
              >
                Ver guia completo
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>

            <div className="space-y-6">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className="relative rounded-xl border border-border-color bg-card-bg p-6 shadow-sm"
                >
                  <span className="mb-3 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-xs font-bold text-white">
                    {step.number}
                  </span>
                  <h3 className="mb-1.5 text-base font-semibold text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/60">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="border-t border-border-color bg-muted-bg/30 px-4 py-20 lg:py-24">
        <div className="container mx-auto max-w-6xl">
          <h2 className="mb-14 text-center text-3xl font-bold text-foreground sm:text-4xl">
            O que dizem nossos estudantes
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.author}
                className="flex flex-col justify-between rounded-2xl border border-border-color bg-card-bg p-6 shadow-sm"
              >
                <p className="mb-6 text-sm italic leading-relaxed text-foreground/70">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="border-t border-border-color pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t.author}
                  </p>
                  <p className="text-xs text-foreground/50">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t border-border-color bg-background px-4 py-20 lg:py-24">
        <div className="container mx-auto max-w-3xl text-center">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 to-transparent p-10 sm:p-14">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-foreground/60">
              Crie sua conta gratuitamente e comece sua jornada rumo à
              aprovação no ENEM. Sem cartão de crédito, sem compromisso.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <AccountLinkButton
                className="inline-flex items-center justify-center rounded-xl bg-primary px-8 py-3.5 text-base font-semibold text-white shadow-md transition-all hover:bg-primary-dark hover:shadow-lg"
                loggedInLabel="Ir para o painel"
                loggedOutLabel="Criar conta grátis"
              />
              <Link
                href="/noticias"
                className="inline-flex items-center justify-center rounded-xl border border-border-color bg-card-bg px-8 py-3.5 text-base font-semibold text-foreground shadow-sm transition-all hover:bg-muted-bg"
              >
                Ver notícias
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
