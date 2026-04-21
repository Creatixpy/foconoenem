import Link from 'next/link';

const sections = [
  {
    id: 'servico',
    title: '1. Objeto do serviço',
    content:
      'O Foco no ENEM é uma plataforma digital de apoio ao estudo que oferece redação com IA, simulados de questões, notícias publicadas na própria plataforma, comunidade entre estudantes, painel de resultados e recebimento de doações voluntárias.',
  },
  {
    id: 'conta',
    title: '2. Conta do usuário',
    content:
      'Algumas funcionalidades exigem cadastro. O usuário deve manter seus dados atualizados, proteger suas credenciais e não compartilhar acesso com terceiros. O uso da conta é pessoal. A plataforma pode restringir ou suspender contas em caso de fraude, abuso técnico, violação destes termos ou risco à segurança do serviço.',
  },
  {
    id: 'uso',
    title: '3. Uso aceitável',
    content:
      'É proibido usar o serviço para fraude, automação abusiva, scraping não autorizado, sobrecarga de infraestrutura, tentativa de burlar limites, publicação de conteúdo ilegal ou ofensivo, assédio, violação de direitos autorais ou qualquer conduta que prejudique outros usuários ou a operação da plataforma.',
  },
  {
    id: 'ia',
    title: '4. Conteúdo gerado por IA',
    content:
      'Correções de redação, temas, textos de apoio, questões e resumos podem ser gerados com auxílio de inteligência artificial. Esses resultados servem como apoio ao estudo. Eles não substituem professor, corretor humano, edital oficial, gabarito institucional ou orientação pedagógica individual. O usuário deve revisar criticamente o material antes de utilizá-lo como base decisiva.',
  },
  {
    id: 'comunidade',
    title: '5. Comunidade',
    content:
      'A comunidade é um espaço moderado para troca entre estudantes. Para participar, é necessário cumprir a idade mínima indicada pela plataforma. Conteúdos podem ser removidos e perfis podem ser sancionados quando houver descumprimento das regras, spam, divulgação indevida de dados pessoais, discurso discriminatório, violência ou comportamento que comprometa o ambiente.',
  },
  {
    id: 'propriedade',
    title: '6. Conteúdo e propriedade intelectual',
    content:
      'O código, design, textos institucionais e marca da plataforma pertencem ao Foco no ENEM ou a seus respectivos titulares. Redações e conteúdos criados pelo usuário permanecem vinculados ao próprio usuário, mas publicações voluntárias em áreas sociais podem ser exibidas dentro da plataforma para viabilizar a funcionalidade comunitária. O usuário não deve publicar conteúdo de terceiros sem autorização.',
  },
  {
    id: 'doacoes',
    title: '7. Doações',
    content:
      'Doações são voluntárias, processadas por Stripe e não garantem benefício acadêmico, prioridade de correção ou acesso privilegiado a funcionalidades. Eventuais reembolsos observarão a legislação aplicável, as regras do meio de pagamento e a análise do caso concreto.',
  },
  {
    id: 'disponibilidade',
    title: '8. Disponibilidade e mudanças',
    content:
      'A plataforma pode evoluir, passar por manutenção, alterar fluxos, ajustar limites de uso e corrigir bugs sem aviso prévio. O serviço é fornecido conforme disponibilidade técnica. O Foco no ENEM busca estabilidade operacional, mas não garante funcionamento ininterrupto, ausência total de falhas ou aderência integral a cronogramas externos do ENEM.',
  },
  {
    id: 'responsabilidade',
    title: '9. Limitações de responsabilidade',
    content:
      'O Foco no ENEM responde pelo que controla dentro de sua operação, mas não garante aprovação em prova, pontuação específica, compatibilidade absoluta entre saída de IA e correção humana ou disponibilidade contínua de fornecedores terceiros. O uso da plataforma deve ser entendido como instrumento de apoio ao estudo, não como promessa de resultado acadêmico.',
  },
  {
    id: 'privacidade',
    title: '10. Privacidade e dados pessoais',
    content:
      'O tratamento de dados pessoais segue a Política de Privacidade publicada na própria plataforma. Ao utilizar o serviço, o usuário declara ciência de que determinados dados precisam ser processados por fornecedores de infraestrutura, autenticação, pagamentos e IA para execução do produto.',
  },
  {
    id: 'alteracoes',
    title: '11. Alterações destes termos',
    content:
      'Os termos podem ser revisados para refletir mudanças legais, operacionais ou técnicas. A versão vigente será sempre a publicada nesta página.',
  },
] as const;

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <section className="border-b border-border-color px-4 py-16 md:py-20">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-3xl font-bold text-text-primary md:text-4xl">Termos de Uso</h1>
          <p className="mt-4 max-w-2xl text-lg text-text-secondary">
            Estes termos descrevem as regras de uso do Foco no ENEM no estado atual da plataforma.
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
            <h3 className="mb-2 text-base font-semibold text-text-primary">Contato</h3>
            <p className="mb-3 text-sm text-text-secondary">
              Questões sobre uso da plataforma, conduta comunitária ou funcionamento geral podem ser enviadas para:
            </p>
            <a href="mailto:contato@foconoenem.com" className="text-sm text-primary hover:text-primary-hover">
              contato@foconoenem.com
            </a>
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
