'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';

const sections = [
  {
    id: 'coleta',
    title: '1. Coleta de Dados',
    content: `Coletamos informações que você fornece diretamente ao criar uma conta, como nome, endereço de email e objetivo de estudo. Também coletamos dados de uso automaticamente, incluindo informações sobre como você interage com a plataforma, notas de redações, resultados de simulados e atividade na comunidade. Utilizamos cookies essenciais para manter sua sessão ativa e preferências de tema. Não coletamos dados sensíveis além do estritamente necessário para o funcionamento do serviço.`,
  },
  {
    id: 'uso',
    title: '2. Uso dos Dados',
    content: `Seus dados são usados para: fornecer e melhorar nossos serviços de preparação para o ENEM; personalizar sua experiência na plataforma; processar correções de redações via inteligência artificial; gerar estatísticas de desempenho no seu dashboard; permitir interações na comunidade; enviar comunicações sobre o serviço quando necessário. Não vendemos seus dados pessoais a terceiros em nenhuma circunstância.`,
  },
  {
    id: 'ia',
    title: '3. Inteligência Artificial',
    content: `Utilizamos modelos de inteligência artificial para correção de redações e geração de questões. Suas redações são enviadas a provedores de IA (como Groq/OpenAI) exclusivamente para fins de correção. Não armazenamos suas redações nos servidores dos provedores de IA além do tempo necessário para processamento. Os feedbacks gerados são armazenados em nosso banco de dados vinculados à sua conta.`,
  },
  {
    id: 'armazenamento',
    title: '4. Armazenamento e Segurança',
    content: `Seus dados são armazenados de forma segura no Supabase, que utiliza criptografia em repouso e em trânsito. Implementamos Row Level Security (RLS) para garantir que cada usuário acesse apenas seus próprios dados. Senhas são criptografadas com bcrypt e nunca armazenadas em texto plano. Realizamos backups regulares e monitoramos acessos não autorizados.`,
  },
  {
    id: 'compartilhamento',
    title: '5. Compartilhamento',
    content: `Compartilhamos dados apenas com: Supabase (hospedagem e banco de dados); provedores de IA (correção de redações, de forma anonimizada quando possível); Stripe (processamento de doações — apenas dados de pagamento); Vercel (hospedagem da aplicação). Nenhum desses parceiros tem permissão para usar seus dados para fins próprios além do serviço prestado.`,
  },
  {
    id: 'direitos',
    title: '6. Seus Direitos',
    content: `De acordo com a LGPD (Lei Geral de Proteção de Dados), você tem direito a: acessar todos os dados que temos sobre você; solicitar correção de dados incorretos; solicitar a exclusão de seus dados e conta; revogar consentimento a qualquer momento; solicitar portabilidade dos seus dados. Para exercer qualquer desses direitos, entre em contato pelo email indicado abaixo.`,
  },
  {
    id: 'menores',
    title: '7. Menores de Idade',
    content: `Nossa plataforma é destinada a estudantes, que frequentemente são menores de idade. Exigimos confirmação de idade (mínimo 16 anos) para participação na comunidade. Não coletamos deliberadamente dados de crianças menores de 13 anos. Se tomarmos conhecimento de que coletamos dados de uma criança menor de 13 anos, tomaremos medidas para excluir essas informações.`,
  },
  {
    id: 'alteracoes',
    title: '8. Alterações nesta Política',
    content: `Podemos atualizar esta política periodicamente. Notificaremos sobre alterações significativas por meio de aviso na plataforma ou por email. O uso contínuo da plataforma após alterações constitui aceitação da política atualizada. Recomendamos revisar esta página periodicamente.`,
  },
];

export default function PrivacidadePage() {
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
            Política de Privacidade
          </motion.h1>
          <motion.p
            className="text-text-secondary text-lg"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            Sua privacidade é importante para nós. Entenda como coletamos, usamos e protegemos seus dados.
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

          {/* Contact */}
          <div className="mt-16 p-6 rounded-xl bg-card-bg border border-border-color">
            <h3 className="text-base font-semibold text-text-primary mb-2">Dúvidas sobre privacidade?</h3>
            <p className="text-sm text-text-secondary mb-3">
              Entre em contato conosco para qualquer questão relacionada à sua privacidade e proteção de dados.
            </p>
            <a
              href="mailto:privacidade@foconoenem.com"
              className="text-sm text-primary hover:text-primary-hover transition-colors"
            >
              privacidade@foconoenem.com
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
