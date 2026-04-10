'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

const sections = [
  {
    id: 'aceitacao',
    title: '1. Aceitação dos Termos',
    content: `Ao acessar e utilizar a plataforma FocoNoEnem, você concorda com estes Termos de Uso em sua totalidade. Se você não concordar com qualquer parte destes termos, não deve utilizar a plataforma. Reservamo-nos o direito de atualizar estes termos a qualquer momento, e o uso contínuo da plataforma após alterações constitui aceitação dos novos termos.`,
  },
  {
    id: 'servico',
    title: '2. Descrição do Serviço',
    content: `FocoNoEnem é uma plataforma educacional online que oferece: correção de redações por inteligência artificial com feedback detalhado por competência do ENEM; simulados com questões personalizadas por disciplina; comunidade para interação entre estudantes; notícias e informações sobre o ENEM; dashboard com acompanhamento de desempenho. O serviço é oferecido gratuitamente, com possibilidade de doações voluntárias.`,
  },
  {
    id: 'conta',
    title: '3. Conta do Usuário',
    content: `Para acessar funcionalidades completas, é necessário criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de acesso. Cada pessoa deve ter apenas uma conta. Informações fornecidas devem ser verdadeiras e atualizadas. Reservamo-nos o direito de suspender contas que violem estes termos ou apresentem atividade suspeita.`,
  },
  {
    id: 'uso-aceitavel',
    title: '4. Uso Aceitável',
    content: `Ao usar a plataforma, você concorda em: não publicar conteúdo ofensivo, discriminatório ou ilegal na comunidade; não tentar manipular o sistema de correção de redações; não compartilhar contas ou credenciais com terceiros; não utilizar bots, scrapers ou ferramentas automatizadas; não violar direitos de propriedade intelectual; respeitar outros usuários e manter um ambiente saudável de aprendizagem.`,
  },
  {
    id: 'ia',
    title: '5. Inteligência Artificial',
    content: `As correções de redações e geração de questões são realizadas por modelos de inteligência artificial. Os resultados são fornecidos como ferramenta de apoio ao estudo e não substituem a avaliação de professores qualificados. As notas geradas pela IA são aproximações baseadas nos critérios do ENEM e podem não refletir exatamente a nota que seria obtida na prova real. Não garantimos precisão absoluta nas correções.`,
  },
  {
    id: 'comunidade',
    title: '6. Regras da Comunidade',
    content: `A comunidade é um espaço para troca de conhecimento entre estudantes. É proibido: linguagem ofensiva, bullying ou assédio; spam ou propaganda; compartilhamento de material protegido por direitos autorais; conteúdo sexual ou violento; divulgação de informações pessoais de terceiros. A participação na comunidade requer confirmação de idade mínima de 16 anos. Moderamos conteúdo e podemos remover posts que violem as regras.`,
  },
  {
    id: 'propriedade',
    title: '7. Propriedade Intelectual',
    content: `Todo o conteúdo da plataforma, incluindo código, design, textos e marca, é propriedade do FocoNoEnem ou licenciado para uso. Redações enviadas permanecem de propriedade do autor. Ao publicar conteúdo na comunidade, você concede ao FocoNoEnem uma licença não exclusiva para exibição dentro da plataforma. Questões e materiais de estudo podem ter origem em fontes públicas e são utilizados com fins educacionais.`,
  },
  {
    id: 'doacoes',
    title: '8. Doações',
    content: `Doações são voluntárias e processadas de forma segura via Stripe. Doações não conferem benefícios adicionais ou acesso diferenciado à plataforma. Valores doados não são reembolsáveis, exceto em casos previstos pelo Código de Defesa do Consumidor. Doações são utilizadas para manutenção e melhoria da plataforma.`,
  },
  {
    id: 'limitacao',
    title: '9. Limitação de Responsabilidade',
    content: `A plataforma é fornecida "como está". Não garantimos: disponibilidade ininterrupta do serviço; precisão absoluta das correções de IA; que o uso da plataforma resultará em aprovação no ENEM; ausência de erros ou bugs. Não nos responsabilizamos por: decisões tomadas com base nos resultados da plataforma; perda de dados devido a problemas técnicos; conteúdo publicado por outros usuários na comunidade. Nosso compromisso é oferecer a melhor ferramenta possível de apoio aos estudos.`,
  },
];

export default function TermosPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="py-16 md:py-24 px-4 border-b border-border-color">
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-3xl md:text-4xl font-bold text-text-primary mb-4"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          >
            Termos de Uso
          </motion.h1>
          <motion.p
            className="text-text-secondary text-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            Leia atentamente os termos que regem o uso da plataforma FocoNoEnem.
          </motion.p>
          <motion.p
            className="text-text-muted text-sm mt-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          >
            Última atualização: Abril de 2025
          </motion.p>
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-12 flex gap-12">
        {/* TOC sidebar — desktop only */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <nav className="sticky top-24 space-y-1">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Índice</p>
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => { setActiveSection(s.id); scrollToSection(s.id); }}
                className={`block w-full text-left text-sm py-1.5 px-3 rounded-lg transition-colors ${
                  activeSection === s.id
                    ? 'text-primary bg-primary-light'
                    : 'text-text-secondary hover:text-text-primary hover:bg-muted-bg'
                }`}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0">
          <div className="space-y-10">
            {sections.map((s, i) => (
              <motion.section
                key={s.id}
                id={s.id}
                className="scroll-mt-24"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onViewportEnter={() => setActiveSection(s.id)}
              >
                <h2 className="text-xl font-semibold text-text-primary mb-3">{s.title}</h2>
                <p className="text-text-secondary leading-relaxed text-[15px] whitespace-pre-line">{s.content}</p>
              </motion.section>
            ))}
          </div>

          <div className="mt-16 p-6 rounded-xl bg-card-bg border border-border-color">
            <h3 className="text-base font-semibold text-text-primary mb-2">Tem alguma dúvida?</h3>
            <p className="text-sm text-text-secondary mb-3">
              Se tiver qualquer dúvida sobre nossos termos, entre em contato.
            </p>
            <a
              href="mailto:contato@foconoenem.com"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              contato@foconoenem.com
            </a>
          </div>

          <div className="mt-8">
            <Link href="/" className="text-sm text-text-muted hover:text-text-secondary transition-colors">
              ← Voltar ao início
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
