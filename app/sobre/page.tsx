import Link from 'next/link';

const pilares = [
  {
    title: 'Redação',
    description:
      'Geração de tema, textos de apoio, envio manual de tema quando o usuário preferir e correção estruturada por competências.',
  },
  {
    title: 'Questões',
    description:
      'Simulados por disciplina com mistura de questões reaproveitadas e novas, reduzindo repetição para o mesmo usuário.',
  },
  {
    title: 'Notícias',
    description:
      'Publicação de notícias aprovadas na própria plataforma, com página pública indexável e resumo por IA sobre o acervo publicado.',
  },
  {
    title: 'Conta e histórico',
    description:
      'Painel com resultados, estatísticas e histórico de uso para acompanhar evolução ao longo da preparação.',
  },
  {
    title: 'Doações',
    description:
      'Apoio voluntário via Stripe para ajudar a manter a operação da plataforma.',
  },
] as const;

const principios = [
  'Acesso simples: concentrar estudo, correção e acompanhamento em um mesmo produto.',
  'IA com função de apoio: a plataforma automatiza tarefas de estudo, mas não substitui professor, corretor humano ou edital oficial.',
  'Reaproveitamento inteligente: redações, temas e questões armazenados são usados para aumentar consistência e reduzir desperdício de geração.',
  'Melhoria contínua: o sistema é ajustado a partir de uso real, revisão técnica e manutenção da infraestrutura.',
] as const;

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-bg">
      <section className="relative overflow-hidden border-b border-border py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-medium text-brand">
            Sobre a AprovIA
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-text md:text-5xl">
            Uma plataforma de estudo focada em prática, correção e acompanhamento
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-text-2">
            A AprovIA reúne redação, questões, notícias e histórico em um fluxo único. A proposta é reduzir atrito operacional e dar ao estudante uma rotina mais consistente.
          </p>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-text md:text-3xl">O que a plataforma entrega hoje</h2>
            <p className="mt-3 max-w-2xl text-text-2">
              A descrição abaixo foi alinhada ao estado atual do código e da infraestrutura publicada.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pilares.map((item) => (
              <article
                key={item.title}
                className="rounded-xl border border-border bg-surface p-6 transition-colors hover:border-border-hover"
              >
                <h3 className="text-base font-semibold text-text">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-text-2">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-surface px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-text md:text-3xl">Princípios de operação</h2>
          <div className="mt-8 space-y-4">
            {principios.map((item) => (
              <div
                key={item}
                className="rounded-xl border border-border bg-surface px-5 py-4 text-sm leading-relaxed text-text-2"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl rounded-2xl border border-border bg-surface p-8 text-center">
          <h2 className="text-2xl font-bold text-text md:text-3xl">Contato e transparência</h2>
          <p className="mx-auto mt-4 max-w-2xl text-text-2">
            Dúvidas sobre funcionamento, conta, privacidade ou uso do serviço podem ser enviadas pelos canais públicos da plataforma.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <a href="mailto:creatixpy@gmail.com" className="text-sm font-medium text-brand hover:text-brand-hover">
              creatixpy@gmail.com
            </a>
            <Link href="/privacidade" className="text-sm font-medium text-brand hover:text-brand-hover">
              Política de Privacidade
            </Link>
            <Link href="/termos" className="text-sm font-medium text-brand hover:text-brand-hover">
              Termos de Uso
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
