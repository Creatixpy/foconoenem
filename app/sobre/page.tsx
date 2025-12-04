import { AccountLinkButton } from "../components/ui";
import Link from "next/link";

const timeline = [
  {
    year: "2022",
    title: "Ideia em um grupo de estudos",
    description:
      "Depois de enfrentar dificuldades com correções de redação, criamos os primeiros prompts e planilhas para ajudar colegas.",
  },
  {
    year: "2023",
    title: "Primeiro MVP publicado",
    description:
      "Lançamos um formulário simples com correção automática. Recebemos feedback de centenas de estudantes do Brasil inteiro.",
  },
  {
    year: "2024",
    title: "Nasce o Foco no ENEM",
    description:
      "Criamos a plataforma completa com simulados, dashboards e notícias, sempre com o objetivo de acesso gratuito.",
  },
];

const valores = [
  {
    emoji: "🆓",
    title: "Acessibilidade",
    description: "Ferramentas completas e gratuitas, porque estudar para o ENEM não pode ser privilégio.",
  },
  {
    emoji: "🤖",
    title: "Tecnologia útil",
    description: "IA a serviço da aprendizagem, oferecendo feedback claro e personalizado.",
  },
  {
    emoji: "🔒",
    title: "Privacidade",
    description: "Cuidamos dos dados dos estudantes com políticas transparentes e seguras.",
  },
  {
    emoji: "🤝",
    title: "Comunidade",
    description: "Feito por alunos, para alunos. Valorizamos apoio mútuo e troca de experiências.",
  },
];

const recursos = [
  {
    icon: "✍️",
    title: "Correção de redação com IA",
    description: "Análise por competência, sugestões de melhoria e notas estimadas.",
  },
  {
    icon: "🧠",
    title: "Simulados personalizados",
    description: "Monte provas por disciplina e receba explicações comentadas.",
  },
  {
    icon: "📰",
    title: "Notícias curadas",
    description: "Atualizações e temas relevantes para enriquecer o repertório sociocultural.",
  },
  {
    icon: "🎯",
    title: "Painel de desempenho",
    description: "Acompanhe evolução em gráficos e descubra onde melhorar a cada semana.",
  },
];

export const metadata = {
  title: "Sobre - Foco no ENEM",
  description:
    "Conheça a história e missão do Foco no ENEM, uma plataforma criada por alunos para ajudar estudantes a se prepararem para o ENEM.",
};

export default function SobrePage() {
  return (
    <main className="flex-grow">
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
        <div className="container relative z-10 mx-auto max-w-5xl space-y-12">
          <div className="space-y-5 rounded-2xl border-0 bg-card-bg p-8 text-center shadow-sm md:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary shadow-sm justify-center">
              💙 Feito por alunos para alunos
            </span>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Preparação para o ENEM sem excesso de texto.
            </h1>
            <p className="mx-auto max-w-2xl text-base text-foreground/60">
              Criamos correção, simulados e notícias curtas para democratizar ferramentas de qualidade.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/redacao" className="btn btn-primary px-6 py-3 text-sm">
                Praticar redação agora
              </Link>
              <AccountLinkButton
                className="btn btn-outline px-6 py-3 text-sm"
                loggedOutLabel="Criar uma conta gratuita"
                loggedInLabel="Acessar minha conta"
              />
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border-0 bg-card-bg p-8 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">📖</span>
              <h2 className="text-2xl font-semibold text-foreground">Nossa história</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {timeline.map((item) => (
                <div key={item.year} className="rounded-2xl border-0 bg-card-bg p-5 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">{item.year}</p>
                  <h3 className="mt-3 text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-sm text-foreground/60">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 rounded-2xl border-0 bg-card-bg p-8 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">✨</span>
              <h2 className="text-2xl font-semibold text-foreground">O que entregamos para você</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {recursos.map((feature) => (
                <div key={feature.title} className="flex h-full flex-col gap-3 rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
                  <span className="text-2xl">{feature.icon}</span>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="text-sm text-foreground/60">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8 rounded-2xl border-0 bg-card-bg p-8 shadow-sm md:p-10">
            <div className="flex items-center gap-3">
              <span className="text-3xl">💎</span>
              <h2 className="text-2xl font-semibold text-foreground">Nossos valores</h2>
            </div>
            <div className="grid gap-6 sm:grid-cols-2">
              {valores.map((valor) => (
                <div key={valor.title} className="flex h-full flex-col gap-3 rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
                  <span className="text-2xl">{valor.emoji}</span>
                  <h3 className="text-lg font-semibold text-foreground">{valor.title}</h3>
                  <p className="text-sm text-foreground/60">{valor.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border-0 bg-card-bg p-10 text-center shadow-sm">
            <div className="space-y-5">
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Vamos construir sua aprovação juntos?
              </h2>
              <p className="mx-auto max-w-2xl text-sm text-foreground/60">
                Cadastre-se gratuitamente, monte seu plano de estudos e acompanhe todo o progresso. Estamos lançando novidades
                constantemente para apoiar sua jornada rumo ao ensino superior.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <AccountLinkButton
                  className="btn btn-primary px-6 py-3 text-sm"
                  loggedInLabel="Acessar minha conta"
                />
                <Link href="/noticias" className="btn btn-outline px-6 py-3 text-sm">
                  Ver novidades do ENEM
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
