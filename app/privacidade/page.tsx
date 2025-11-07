"use client";

const policySections = [
  {
    id: "introducao",
    title: "Introdução",
    paragraphs: [
      "O Foco no ENEM está comprometido em proteger a privacidade dos estudantes que utilizam nossos serviços. Esta política explica como coletamos, usamos e guardamos suas informações.",
      "Todo processamento segue as orientações da Lei Geral de Proteção de Dados (LGPD) e boas práticas de segurança na nuvem.",
    ],
  },
  {
    id: "conta",
    title: "Informações de conta",
    alert: "A criação de conta é opcional. Você pode praticar redações e simulados sem se cadastrar.",
    list: [
      "Email (para login e comunicações)",
      "Senha (criptografada com bcrypt)",
      "Nome completo (para personalizar o painel)",
      "Objetivo, bio e ano do ENEM (opcionais)",
      "Foto de perfil (opcional)",
    ],
  },
  {
    id: "producao",
    title: "Dados de produção",
    paragraphs: [
      "Ao utilizar redação ou simulados, podemos receber:",
      "Se você estiver logado, guardamos esses dados no Supabase para gerar histórico e relatórios personalizados. Sem login, armazenamos apenas o necessário para corrigir o envio e entregá-lo na sessão atual.",
    ],
    list: [
      "Texto das redações enviadas",
      "Notas, feedbacks e análises por competência",
      "Respostas e resultados de simulados de questões",
      "Temas personalizados e textos de apoio que você fornece",
    ],
  },
  {
    id: "ia",
    title: "Uso de inteligência artificial",
    paragraphs: [
      "Utilizamos a infraestrutura da Groq (modelo GPT OSS 120B) para correção de redações, geração de questões, temas e feedbacks.",
      "Os textos são enviados de forma segura apenas para processamento. O provedor não utiliza seus dados para treinar modelos.",
    ],
  },
  {
    id: "armazenamento",
    title: "Onde e como armazenamos",
    list: [
      "Supabase (PostgreSQL) hospedado em São Paulo (sa-east-1)",
      "Backups automáticos diários",
      "Row Level Security (RLS): cada usuário acessa apenas os próprios dados",
      "Criptografia em repouso e em trânsito",
    ],
  },
  {
    id: "compartilhamento",
    title: "Compartilhamento",
    paragraphs: [
      "Não vendemos nem compartilhamos suas informações pessoais com terceiros, exceto:",
      "Para todos os demais casos, pediremos consentimento explícito.",
    ],
    list: [
      "Quando necessário para processar redações/questões (provedor de IA)",
      "Para cumprir exigências legais",
      "Para proteger nossos direitos ou investigar fraudes",
    ],
  },
  {
    id: "direitos",
    title: "Seus direitos (LGPD)",
    paragraphs: [
      "Você pode solicitar a qualquer momento:",
      "Atendemos requisições pelo email contato@foconoenem.com. Responderemos em até 15 dias úteis.",
    ],
    list: [
      "Acesso aos dados pessoais",
      "Correção de informações incorretas ou incompletas",
      "Portabilidade em formato legível por máquina",
      "Exclusão completa da conta e históricos",
      "Revogação de consentimento para comunicações",
    ],
  },
  {
    id: "cookies",
    title: "Cookies e métricas",
    paragraphs: [
      "Usamos cookies essenciais para manter sessões e melhorar a experiência. Não utilizamos trackers invasivos.",
      "Registramos métricas agregadas para entender o uso das funcionalidades e priorizar melhorias.",
    ],
  },
  {
    id: "alteracoes",
    title: "Alterações nesta política",
    paragraphs: [
      "Podemos atualizar este documento periodicamente. Publicaremos a nova versão nesta página e, quando apropriado, avisaremos por email.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-grow">
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto max-w-5xl space-y-10">
            <div className="surface-card space-y-5 p-8 shadow-xl md:p-12">
              <span className="hero-status shadow-glow w-fit text-sm">
                🔒 Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </span>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Política de Privacidade</h1>
              <p className="text-base text-foreground/75">
                Este documento explica como tratamos as informações que você compartilha com o Foco no ENEM. Transparência é
                fundamental: leia com atenção para entender seus direitos e escolhas.
              </p>
            </div>

            <div className="surface-card p-6 shadow-xl md:p-8">
              <h2 className="text-lg font-semibold text-foreground">Resumo rápido</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {policySections.map((section) => (
                  <li key={section.id} className="text-sm">
                    <a href={`#${section.id}`} className="text-primary font-semibold hover:underline">
                      {section.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-8">
              {policySections.map((section, index) => (
                <article key={section.id} id={section.id} className="surface-card space-y-4 border border-border-color/60 p-6 shadow-sm md:p-8">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-xl font-semibold text-foreground">{section.title}</h2>
                  </div>
                  {section.alert && (
                    <div className="rounded-2xl border border-success/40 bg-success/10 p-4 text-sm text-success">{section.alert}</div>
                  )}
                  {section.paragraphs &&
                    section.paragraphs.map((paragraph) => (
                      <p key={paragraph} className="text-sm text-foreground/75 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  {section.list && (
                    <ul className="list-disc space-y-2 pl-6 text-sm text-foreground/70">
                      {section.list.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>

            <div className="gradient-border cta-surface overflow-hidden rounded-[2.5rem] p-10 text-center shadow-2xl backdrop-blur">
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-foreground sm:text-3xl">Estamos disponíveis para esclarecer dúvidas.</h2>
                <p className="mx-auto max-w-3xl text-sm text-foreground/75">
                  Se precisar exercer seus direitos ou falar sobre privacidade, envie um email para contato@foconoenem.com.
                  Responderemos em até 15 dias úteis.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
  );
}
