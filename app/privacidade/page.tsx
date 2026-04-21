import Link from 'next/link';

const sections = [
  {
    id: 'controlador',
    title: '1. Quem controla os dados',
    content:
      'O Foco no ENEM controla os dados pessoais tratados diretamente na plataforma para viabilizar conta, correção de redação, simulados, comunidade, histórico de resultados, notícias e suporte operacional. Para assuntos de privacidade, os canais públicos atuais são privacidade@foconoenem.com e contato@foconoenem.com.',
  },
  {
    id: 'coleta',
    title: '2. Quais dados tratamos',
    content:
      'Tratamos dados fornecidos no cadastro, como nome, email e objetivo de estudo; dados de uso, como temas gerados, redações enviadas, resultados de questões, interações na comunidade e eventos de conta; e dados técnicos indispensáveis para autenticação, segurança, prevenção de abuso, logs e funcionamento da interface. Dados de cartão não são armazenados pelo Foco no ENEM: pagamentos e doações são processados pela Stripe.',
  },
  {
    id: 'finalidades',
    title: '3. Finalidades e bases legais',
    content:
      'Os dados são tratados para executar o serviço solicitado pelo usuário, manter autenticação e segurança, personalizar estudo, armazenar histórico acadêmico dentro da plataforma, prevenir fraude e abuso, atender obrigações legais e responder solicitações do titular. Dependendo do caso, o tratamento pode se apoiar em execução de contrato, legítimo interesse, cumprimento de obrigação legal e consentimento quando exigido.',
  },
  {
    id: 'ia',
    title: '4. Uso de inteligência artificial',
    content:
      'A plataforma utiliza provedores de IA para correção de redações, geração de temas, textos de apoio, questões e resumos do acervo de notícias. Hoje o provedor integrado no código é a Groq. Redações, prompts e respostas podem ser processados por esse fornecedor para executar a solicitação. Conforme a documentação pública da Groq, requisições de inferência não são retidas por padrão, mas podem ser temporariamente registradas por até 30 dias para confiabilidade e investigação de abuso, salvo configurações mais restritivas do cliente. Os resultados retornados pela IA são armazenados no banco do Foco no ENEM quando necessários ao funcionamento do produto.',
  },
  {
    id: 'compartilhamento',
    title: '5. Compartilhamento e transferências internacionais',
    content:
      'O Foco no ENEM compartilha dados com prestadores essenciais de infraestrutura e operação, incluindo Supabase, Vercel, Stripe e Groq. Esses serviços podem processar dados fora do Brasil, conforme sua arquitetura e região de infraestrutura. Quando isso ocorre, o tratamento continua vinculado às finalidades desta política e às salvaguardas contratuais e técnicas aplicáveis.',
  },
  {
    id: 'retencao',
    title: '6. Retenção e exclusão',
    content:
      'Dados de conta e histórico acadêmico permanecem armazenados enquanto a conta estiver ativa ou enquanto forem necessários para prestação do serviço, auditoria, segurança e defesa de direitos. O usuário pode solicitar exclusão da conta e, quando juridicamente possível, eliminação dos dados associados. Alguns registros podem ser mantidos por prazo adicional quando houver obrigação legal, necessidade de prevenção a fraude, investigação de abuso ou preservação mínima de logs operacionais.',
  },
  {
    id: 'direitos',
    title: '7. Direitos do titular',
    content:
      'Nos termos da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação quando cabível, portabilidade, informação sobre compartilhamento, revogação de consentimento e revisão de decisões automatizadas quando aplicável. O pedido deve ser enviado primeiro ao controlador pelos canais da plataforma. Se a resposta for insatisfatória, o titular pode recorrer à ANPD, conforme as orientações oficiais da Autoridade.',
  },
  {
    id: 'menores',
    title: '8. Crianças e adolescentes',
    content:
      'A plataforma é voltada a estudantes e pode ser usada por adolescentes. Para participação na comunidade, o produto exige idade mínima de 16 anos. O tratamento de dados de crianças e adolescentes deve observar seu melhor interesse. Se responsável legal ou usuário identificar uso inadequado de dados pessoais envolvendo menor de idade, deve entrar em contato imediatamente pelos canais de privacidade da plataforma.',
  },
  {
    id: 'seguranca',
    title: '9. Segurança',
    content:
      'O Foco no ENEM adota medidas de segurança compatíveis com sua operação, incluindo controle de acesso, criptografia em trânsito, políticas de autorização no banco, rate limiting e restrição de uso de chaves privilegiadas no backend. As credenciais de autenticação são gerenciadas pelo provedor de autenticação; a plataforma não armazena senhas em texto puro.',
  },
  {
    id: 'alteracoes',
    title: '10. Alterações nesta política',
    content:
      'Esta política pode ser atualizada para refletir mudanças técnicas, regulatórias ou operacionais. A versão vigente será publicada nesta página com data de atualização revisada.',
  },
] as const;

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <section className="border-b border-border-color px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Política de Privacidade</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Esta política descreve como o Foco no ENEM trata dados pessoais no estado atual da plataforma.
          </p>
          <p className="mt-4 text-sm text-text-muted">Última atualização: 21 de abril de 2026</p>
        </div>
      </section>

      <div className="mx-auto flex max-w-4xl gap-12 px-4 py-12">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Índice</p>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-muted-bg hover:text-text-primary"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="space-y-10">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                <h2 className="mb-3 text-xl font-semibold text-text-primary">{section.title}</h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-secondary">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-border-color bg-card-bg p-6">
            <h3 className="mb-2 text-base font-semibold text-text-primary">Exercício de direitos e contato</h3>
            <p className="mb-3 text-sm text-text-secondary">
              Para solicitações de privacidade, envie um email com identificação mínima do pedido e contexto da conta.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a href="mailto:privacidade@foconoenem.com" className="text-primary hover:text-primary-hover">
                privacidade@foconoenem.com
              </a>
              <a href="mailto:contato@foconoenem.com" className="text-primary hover:text-primary-hover">
                contato@foconoenem.com
              </a>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/" className="text-sm text-text-muted transition-colors hover:text-text-secondary">
              ← Voltar ao início
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
