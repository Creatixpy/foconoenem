"use client";

import Header from "../components/Header";
import Footer from "../components/Footer";

const sections = [
  {
    id: "aceitacao",
    title: "Aceitação dos Termos",
    content:
      "Ao acessar ou usar o Foco no ENEM, você concorda em cumprir integralmente estes Termos de Serviço. Caso não concorde com qualquer item, interrompa o uso do site imediatamente.",
  },
  {
    id: "descricao",
    title: "Descrição do Serviço",
    content:
      "Oferecemos simulados de redação e questões, notícias educacionais e um painel opcional com métricas personalizadas para quem cria conta. A correção utiliza inteligência artificial e pode sofrer ajustes contínuos.",
    list: [
      "Simulado de redação com correção por IA alinhada ao ENEM",
      "Simulado de questões objetivas de múltiplas disciplinas",
      "Dashboard de desempenho, estatísticas e recomendações (para contas cadastradas)",
      "Notícias e atualidades relevantes para repertório sociocultural",
    ],
  },
  {
    id: "conta",
    title: "Sistema de contas",
    subsections: [
      {
        subtitle: "Uso sem cadastro",
        description:
          "Você pode usar os simulados e visualizar resultados sem criar uma conta. Nesse modo, as suas redações e respostas não ficam salvas no histórico.",
        list: [
          "Correção completa de redação e simulados pontuais",
          "Acesso à lista de notícias e aos conteúdos públicos",
          "Sem armazenamento persistente de dados pessoais",
        ],
      },
      {
        subtitle: "Benefícios com conta",
        description:
          "Ao criar uma conta gratuita, você ganha espaço para guardar seu histórico e visualizar relatórios personalizados.",
        list: [
          "Dashboard com métricas de redação e questões",
          "Armazenamento de redações, notas e feedbacks",
          "Recomendações baseadas na sua evolução",
          "Sincronização em qualquer dispositivo",
        ],
      },
    ],
  },
  {
    id: "horario",
    title: "Horário de funcionamento",
    content:
      "O simulador de redação fica disponível das 7h às 23h30 (horário de Brasília). Fora desse período, você pode navegar pelo site, mas não conseguirá enviar redações para correção. Essa limitação ajuda a gerenciar os custos de IA.",
  },
  {
    id: "restricoes",
    title: "Restrições de uso",
    content: "Ao usar nossos serviços você concorda em não:",
    list: [
      "Enviar conteúdo ofensivo, difamatório, pornográfico ou ilegal.",
      "Utilizar o serviço para plagiar ou fraudar trabalhos acadêmicos.",
      "Tentar acessar, modificar ou interferir nas estruturas internas do site.",
      "Usar ferramentas automatizadas ou bots sem autorização prévia.",
      "Compartilhar conteúdo que viole direitos autorais ou propriedade intelectual.",
    ],
  },
  {
    id: "dados",
    title: "Propriedade intelectual e uso de dados",
    content:
      "Você mantém todos os direitos sobre as redações enviadas. Ao usar o serviço, concede ao Foco no ENEM uma licença limitada para processar seus textos com IA, armazenar resultados e gerar estatísticas agregadas. Nunca vendemos dados individuais.",
  },
  {
    id: "limitacao",
    title: "Limitação de garantias e responsabilidade",
    content:
      "O Foco no ENEM é fornecido 'como está', sem garantias de desempenho, disponibilidade contínua ou precisão absoluta. Não nos responsabilizamos por danos diretos ou indiretos decorrentes do uso ou impossibilidade de uso do serviço.",
  },
  {
    id: "alteracoes",
    title: "Alterações nos Termos",
    content:
      "Podemos atualizar estes Termos sempre que necessário. Enviaremos notificações nas páginas principais ou por email (quando aplicável). O uso contínuo do serviço após mudanças indica concordância com os novos termos.",
  },
  {
    id: "contato",
    title: "Contato",
    content:
      "Em caso de dúvidas ou solicitações, fale conosco pelo email contato@foconoenem.com. Responderemos o mais rápido possível.",
  },
];

export default function TermsOfServicePage() {
  return (
    <div className="flex min-h-screen flex-col bg-page-gradient text-foreground">
      <Header />

      <main className="flex-grow">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto max-w-5xl space-y-10">
            <div className="surface-card space-y-5 p-8 shadow-xl md:p-12">
              <span className="hero-status shadow-glow w-fit text-sm">
                📄 Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Termos de Serviço</h1>
              <p className="text-base text-foreground/75">
                Estes termos definem como você pode utilizar o Foco no ENEM. Leia com atenção: queremos garantir um ambiente seguro,
                ético e transparente para todos que estudam conosco.
              </p>
            </div>

            <div className="surface-card p-6 shadow-xl md:p-8">
              <h2 className="text-lg font-semibold text-foreground">Guia rápido</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {sections.map((section) => (
                  <li key={section.id} className="text-sm">
                    <a href={`#${section.id}`} className="text-primary font-semibold hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              {sections.map((section, index) => (
                <article key={section.id} id={section.id} className="surface-card space-y-4 border border-border-color/60 p-6 shadow-sm md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  </div>
                  <p className="text-sm text-foreground/75 leading-relaxed">{section.content}</p>
                  {section.list && (
                    <ul className="list-disc space-y-2 pl-6 text-sm text-foreground/70">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                  {section.subsections && (
                    <div className="space-y-6">
                      {section.subsections.map((subsection) => (
                        <div key={subsection.subtitle} className="rounded-2xl border border-border-color/50 bg-card-bg/80 p-5">
                          <p className="text-sm font-semibold text-foreground">{subsection.subtitle}</p>
                          <p className="mt-2 text-sm text-foreground/70">{subsection.description}</p>
                          {subsection.list && (
                            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-foreground/70">
                              {subsection.list.map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>

            <div className="gradient-border cta-surface overflow-hidden rounded-[2.5rem] p-10 text-center shadow-2xl backdrop-blur">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">
                  Obrigado por estudar com o Foco no ENEM 💙
                </h2>
                <p className="mx-auto max-w-3xl text-sm text-foreground/75">
                  Respeitar estes termos nos ajuda a manter o projeto sustentável, seguro e disponível para milhares de estudantes.
                  Caso precise de algo, estamos sempre a um email de distância.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
