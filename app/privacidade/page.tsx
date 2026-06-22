import Link from 'next/link';

const sections = [
  {
    id: 'controlador',
    title: '1. Quem controla os dados',
    content:
      'A AprovIA controla os dados pessoais tratados diretamente na plataforma para viabilizar conta, correção de redação, simulados, histórico de resultados, notícias e suporte operacional. Como o projeto ainda não possui domínio próprio nem email profissional, o canal público atual para privacidade e suporte é creatixpy@gmail.com.',
  },
  {
    id: 'coleta',
    title: '2. Quais dados tratamos',
    content:
      'Tratamos dados fornecidos no cadastro, como nome, email e objetivo de estudo; dados de uso, como temas gerados, redações enviadas, resultados de questões, eventos de conta e navegação funcional; e dados técnicos indispensáveis para autenticação, segurança, prevenção de abuso, logs e funcionamento da interface. Dados de cartão não são armazenados pela AprovIA: pagamentos e doações são processados pela Stripe.',
  },
  {
    id: 'cookies',
    title: '3. Cookies, armazenamento local e métricas',
    content:
      'A plataforma usa cookies essenciais para autenticação, segurança e manutenção da sessão com Supabase. Também usa armazenamento local do navegador para preferências funcionais, como tema visual e sessão do banner de cookies. Métricas opcionais de navegação por Vercel Analytics e Speed Insights só devem ser carregadas quando o usuário aceitar essa finalidade no banner. O usuário pode recusar métricas opcionais e alterar a escolha depois pelo link de preferências no rodapé.',
  },
  {
    id: 'finalidades',
    title: '4. Finalidades e bases legais',
    content:
      'Os dados são tratados para executar o serviço solicitado pelo usuário, manter autenticação e segurança, personalizar estudo, armazenar histórico acadêmico dentro da plataforma, prevenir fraude e abuso, atender obrigações legais e responder solicitações do titular. Dependendo do caso, o tratamento pode se apoiar em execução de contrato, legítimo interesse, cumprimento de obrigação legal e consentimento quando exigido.',
  },
  {
    id: 'ia',
    title: '5. Uso de inteligência artificial',
    content:
      'A plataforma utiliza provedores de IA para correção de redações, geração de temas, textos de apoio, questões e resumos do acervo de notícias. No fluxo padrão, a integração principal segue usando Groq. Para usuários com assinatura Max ativa, os fluxos premium de redação, temas e questões podem ser processados pela API compatível com OpenAI da NVIDIA usando o modelo minimaxai/minimax-m2.7; se essa tentativa falhar, o backend pode usar fallback Groq para preservar a disponibilidade do serviço. Redações, prompts e respostas podem ser enviados ao provedor aplicável para executar a solicitação. Os resultados retornados pela IA são armazenados no banco da AprovIA quando necessários ao funcionamento do produto.',
  },
  {
    id: 'compartilhamento',
    title: '6. Compartilhamento e transferências internacionais',
    content:
      'A AprovIA compartilha dados com prestadores essenciais de infraestrutura e operação, incluindo Supabase, Vercel, Stripe, Groq e NVIDIA. Esses serviços podem processar dados fora do Brasil, conforme sua arquitetura e região de infraestrutura. Quando isso ocorre, o tratamento continua vinculado às finalidades desta política e às salvaguardas contratuais e técnicas aplicáveis.',
  },
  {
    id: 'retencao',
    title: '7. Retenção e exclusão',
    content:
      'Dados de conta e histórico acadêmico permanecem armazenados enquanto a conta estiver ativa ou enquanto forem necessários para prestação do serviço, auditoria, segurança e defesa de direitos. O usuário pode solicitar exclusão da conta e, quando juridicamente possível, eliminação dos dados associados. Quando a funcionalidade estiver disponível na área autenticada, a exclusão pode exigir confirmação adicional de identidade, incluindo senha para contas com autenticação local. Alguns registros podem ser mantidos por prazo adicional quando houver obrigação legal, necessidade de prevenção a fraude, investigação de abuso ou preservação mínima de logs operacionais.',
  },
  {
    id: 'direitos',
    title: '8. Direitos do titular',
    content:
      'Nos termos da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, bloqueio ou eliminação quando cabível, portabilidade, informação sobre compartilhamento, informação sobre a possibilidade de negar consentimento, revogação de consentimento e revisão de decisões automatizadas quando aplicável. Parte desses direitos pode ser exercida diretamente pela conta autenticada, incluindo a exclusão da conta quando o fluxo estiver disponível. O pedido também pode ser enviado ao controlador pelo email público do projeto. Se a resposta for insatisfatória, o titular pode recorrer à ANPD, conforme as orientações oficiais da Autoridade.',
  },
  {
    id: 'menores',
    title: '9. Crianças e adolescentes',
    content:
      'A plataforma é voltada a estudantes e pode ser usada por adolescentes. O tratamento de dados de crianças e adolescentes deve observar seu melhor interesse. Se responsável legal ou usuário identificar uso inadequado de dados pessoais envolvendo menor de idade, deve entrar em contato imediatamente pelo canal público do projeto.',
  },
  {
    id: 'seguranca',
    title: '10. Segurança',
    content:
      'A AprovIA adota medidas de segurança compatíveis com sua operação, incluindo controle de acesso, criptografia em trânsito, políticas de autorização no banco, rate limiting e restrição de uso de chaves privilegiadas no backend. As credenciais de autenticação são gerenciadas pelo provedor de autenticação; a plataforma não armazena senhas em texto puro.',
  },
  {
    id: 'alteracoes',
    title: '11. Alterações nesta política',
    content:
      'Esta política pode ser atualizada para refletir mudanças técnicas, regulatórias ou operacionais. A versão vigente será publicada nesta página com data de atualização revisada.',
  },
] as const;

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-bg">
      <section className="border-b border-border px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-text md:text-4xl">Política de Privacidade</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-2">
            Esta política descreve como a AprovIA trata dados pessoais no estado atual da plataforma.
          </p>
          <p className="mt-4 text-sm text-text-3">Última atualização: 31 de maio de 2026</p>
        </div>
      </section>

      <div className="mx-auto flex max-w-4xl gap-12 px-4 py-12">
        <aside className="hidden w-56 flex-shrink-0 lg:block">
          <nav className="sticky top-24 space-y-1">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-3">Índice</p>
            {sections.map((section) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="block rounded-lg px-3 py-1.5 text-sm text-text-2 transition-colors hover:bg-surface-2 hover:text-text"
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
                <h2 className="mb-3 text-xl font-semibold text-text">{section.title}</h2>
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-text-2">
                  {section.content}
                </p>
              </section>
            ))}
          </div>

          <div className="mt-16 rounded-xl border border-border bg-surface p-6">
            <h3 className="mb-2 text-base font-semibold text-text">Exercício de direitos e contato</h3>
            <p className="mb-3 text-sm text-text-2">
              Para solicitações de privacidade, envie um email com identificação mínima do pedido e contexto da conta.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <a href="mailto:creatixpy@gmail.com" className="text-brand hover:text-brand-hover">
                creatixpy@gmail.com
              </a>
            </div>
          </div>

          <div className="mt-8">
            <Link href="/" className="text-sm text-text-3 transition-colors hover:text-text-2">
              ← Voltar ao início
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
