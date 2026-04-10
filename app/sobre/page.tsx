'use client';

import Link from 'next/link';
import { motion } from 'motion/react';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

const timeline = [
  {
    year: '2024',
    title: 'O início',
    desc: 'FocoNoEnem nasce com a missão de democratizar a preparação para o ENEM usando inteligência artificial.',
    icon: '🚀',
  },
  {
    year: '2024',
    title: 'Correção por IA',
    desc: 'Lançamento do sistema de correção de redações com IA, oferecendo feedback detalhado por competência.',
    icon: '🤖',
  },
  {
    year: '2025',
    title: 'Simulados inteligentes',
    desc: 'Questões personalizadas por disciplina com explicações comentadas para cada alternativa.',
    icon: '📝',
  },
  {
    year: '2025',
    title: 'Comunidade ativa',
    desc: 'Fórum de estudantes para troca de experiências, dicas e materiais de estudo.',
    icon: '👥',
  },
];

const values = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Acesso gratuito',
    desc: 'Todas as funcionalidades essenciais disponíveis sem custo. Educação de qualidade para todos.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
      </svg>
    ),
    title: 'IA responsável',
    desc: 'Inteligência artificial usada com transparência e ética para potencializar seus estudos.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
      </svg>
    ),
    title: 'Comunidade',
    desc: 'Um espaço seguro e acolhedor para estudantes compartilharem conhecimento e se motivarem.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: 'Resultados reais',
    desc: 'Acompanhe sua evolução com dados concretos e feedback personalizado para cada competência.',
  },
];

const features = [
  { icon: '✍️', title: 'Redação com IA', desc: 'Correção detalhada das 5 competências do ENEM com feedback personalizado.' },
  { icon: '📊', title: 'Simulados', desc: 'Questões por disciplina com explicações comentadas e acompanhamento de desempenho.' },
  { icon: '📰', title: 'Notícias', desc: 'Fique por dentro das últimas novidades sobre o ENEM e educação.' },
  { icon: '💬', title: 'Comunidade', desc: 'Conecte-se com outros estudantes, tire dúvidas e compartilhe materiais.' },
  { icon: '📈', title: 'Dashboard', desc: 'Acompanhe suas estatísticas, notas e evolução ao longo do tempo.' },
  { icon: '🏆', title: 'Conquistas', desc: 'Ganhe badges e suba de nível conforme avança nos estudos.' },
];

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-bg-base">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary-light text-primary mb-6">
              Sobre nós
            </span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-text-primary mb-6 tracking-tight"
            initial="hidden" animate="visible" variants={fadeUp} custom={1}
          >
            Nossa missão
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
            initial="hidden" animate="visible" variants={fadeUp} custom={2}
          >
            Democratizar a preparação para o ENEM com tecnologia de ponta, tornando a educação de qualidade acessível para todos os estudantes do Brasil.
          </motion.p>
        </div>
      </section>

      {/* Timeline */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-16"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Nossa jornada
          </motion.h2>
          <div className="relative">
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-border-color" />
            {timeline.map((item, i) => (
              <motion.div
                key={i}
                className={`relative flex items-start gap-6 mb-12 ${
                  i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="hidden md:block md:w-1/2" />
                <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-card-bg border border-border-color flex items-center justify-center text-xl">
                  {item.icon}
                </div>
                <div className="flex-1 md:w-1/2">
                  <span className="text-xs font-medium text-primary">{item.year}</span>
                  <h3 className="text-lg font-semibold text-text-primary mt-1">{item.title}</h3>
                  <p className="text-text-secondary mt-1 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-bg-surface">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-4"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Nossos valores
          </motion.h2>
          <motion.p
            className="text-text-secondary text-center mb-12 max-w-xl mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Os princípios que guiam tudo o que fazemos.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-xl bg-card-bg border border-border-color hover:border-border-hover transition-colors"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <div className="w-12 h-12 rounded-lg bg-primary-light text-primary flex items-center justify-center mb-4">
                  {v.icon}
                </div>
                <h3 className="text-base font-semibold text-text-primary mb-2">{v.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-text-primary text-center mb-4"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            O que oferecemos
          </motion.h2>
          <motion.p
            className="text-text-secondary text-center mb-12 max-w-xl mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Ferramentas completas para sua preparação.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={i}
                className="p-6 rounded-xl bg-card-bg border border-border-color hover:border-border-hover transition-colors"
                initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={i}
              >
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <h3 className="text-base font-semibold text-text-primary mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <motion.h2
            className="text-3xl md:text-4xl font-bold text-text-primary mb-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0}
          >
            Comece sua preparação hoje
          </motion.h2>
          <motion.p
            className="text-text-secondary mb-8 text-lg"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}
          >
            Junte-se a milhares de estudantes que já estão usando o FocoNoEnem para conquistar sua vaga.
          </motion.p>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}
          >
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors text-base"
            >
              Começar gratuitamente
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
