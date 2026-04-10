'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useInView } from 'motion/react';
import { useAuth } from '@/lib/auth/context';

/* ================================================================== */
/*  Shared animation helpers                                           */
/* ================================================================== */

function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLElement>(null!);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <section
      ref={ref}
      id={id}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {children}
    </section>
  );
}

/* ================================================================== */
/*  Auth-aware CTA buttons                                             */
/* ================================================================== */

function HeroCTA() {
  const { user, loading, initialized } = useAuth();

  // Reserve space while loading to prevent layout shift
  const minH = 'min-h-[48px]';

  if (!initialized || loading) {
    return <div className={`flex items-center gap-4 ${minH}`} />;
  }

  if (user) {
    return (
      <div className={`flex flex-wrap items-center gap-4 ${minH}`}>
        <Link
          href="/conta"
          className="
            inline-flex items-center gap-2 px-6 py-3 rounded-xl
            bg-[var(--primary)] text-white font-semibold text-base
            hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
            transition-colors duration-[var(--duration-fast)]
            shadow-md hover:shadow-lg
          "
        >
          Ir para o painel
          <ArrowRightIcon />
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex flex-wrap items-center gap-4 ${minH}`}>
      <Link
        href="/register"
        className="
          inline-flex items-center gap-2 px-6 py-3 rounded-xl
          bg-[var(--primary)] text-white font-semibold text-base
          hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
          transition-colors duration-[var(--duration-fast)]
          shadow-md hover:shadow-lg
        "
      >
        Começar gratuitamente
        <ArrowRightIcon />
      </Link>
      <a
        href="#como-funciona"
        className="
          inline-flex items-center gap-2 px-6 py-3 rounded-xl
          text-[var(--text-secondary)] font-semibold text-base
          border border-[var(--border-color)]
          hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--duration-fast)]
        "
      >
        Ver como funciona
      </a>
    </div>
  );
}

function FinalCTA() {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return <div className="min-h-[48px]" />;
  }

  if (user) {
    return (
      <Link
        href="/conta"
        className="
          inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
          bg-[var(--primary)] text-white font-semibold text-base
          hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
          transition-colors duration-[var(--duration-fast)]
          shadow-md hover:shadow-lg
        "
      >
        Ir para o painel
        <ArrowRightIcon />
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      <Link
        href="/register"
        className="
          inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
          bg-[var(--primary)] text-white font-semibold text-base
          hover:bg-[var(--primary-hover)] active:bg-[var(--primary-active)]
          transition-colors duration-[var(--duration-fast)]
          shadow-md hover:shadow-lg
        "
      >
        Criar conta gratuita
        <ArrowRightIcon />
      </Link>
      <Link
        href="/login"
        className="
          inline-flex items-center gap-2 px-8 py-3.5 rounded-xl
          text-[var(--text-secondary)] font-semibold text-base
          border border-[var(--border-color)]
          hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]
          transition-colors duration-[var(--duration-fast)]
        "
      >
        Já tenho conta
      </Link>
    </div>
  );
}

/* ================================================================== */
/*  Small SVG icons                                                    */
/* ================================================================== */

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8l4 4 4-4" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="var(--warning)" stroke="none">
      <path d="M8 0l2.47 4.94L16 5.77l-4 3.86L12.94 16 8 13.27 3.06 16 4 9.63 0 5.77l5.53-.83z" />
    </svg>
  );
}

/* Feature icons */
function PenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
    </svg>
  );
}

function BrainIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4 4 4 0 0 0 2.5 3.7V18a4 4 0 0 0 8 0v-3.3A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 2v20" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function NewspaperIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2m0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </svg>
  );
}

function TargetIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function LightbulbIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6M10 22h4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M7 16l4-8 4 4 4-8" />
    </svg>
  );
}

/* ================================================================== */
/*  HERO SECTION                                                       */
/* ================================================================== */

function HeroSection() {
  return (
    <section className="relative flex items-center justify-center min-h-[calc(100dvh-4rem)] overflow-hidden">
      {/* Background gradient mesh */}
      <div className="absolute inset-0 -z-10" aria-hidden="true">
        <div className="absolute inset-0 bg-[var(--bg-base)]" />
        {/* Radial blurs */}
        <div
          className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'var(--primary)' }}
        />
        <div
          className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'var(--accent)' }}
        />
        {/* Noise overlay for texture */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      </div>

      <div className="container flex flex-col items-center text-center px-4 py-20 md:py-0">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <span className="
            inline-flex items-center gap-2 px-4 py-1.5
            rounded-full text-sm font-medium
            border border-[var(--border-color)]
            text-[var(--text-secondary)]
            bg-[var(--bg-surface)]
          ">
            <span className="text-[var(--primary)]">✦</span>
            Plataforma gratuita para o ENEM
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          className="
            mt-8 text-4xl sm:text-5xl md:text-6xl lg:text-7xl
            font-bold leading-[1.1] tracking-tight
            text-[var(--text-primary)]
            max-w-4xl
          "
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          Prepare-se para o ENEM com{' '}
          <span className="text-[var(--primary)]">inteligência artificial</span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p
          className="
            mt-6 text-lg md:text-xl
            text-[var(--text-muted)] leading-relaxed
            max-w-2xl
          "
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          Redações corrigidas por IA, simulados personalizados e uma
          comunidade ativa. Tudo que você precisa para alcançar sua nota.
        </motion.p>

        {/* CTA */}
        <motion.div
          className="mt-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <HeroCTA />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[var(--text-muted)]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        >
          <ChevronDownIcon />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ================================================================== */
/*  SOCIAL PROOF BAR                                                   */
/* ================================================================== */

const STATS = [
  { value: '10.000+', label: 'Questões geradas' },
  { value: '500+', label: 'Redações corrigidas' },
  { value: '300+', label: 'Estudantes ativos' },
] as const;

function SocialProofBar() {
  return (
    <Section className="py-12 md:py-16 border-y border-[var(--border-color)] bg-[var(--bg-surface)]">
      <div className="container">
        <p className="text-center text-sm text-[var(--text-muted)] mb-8">
          Junte-se a estudantes que já estão se preparando
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                {value}
              </span>
              <span className="text-sm text-[var(--text-muted)]">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  FEATURES BENTO GRID                                                */
/* ================================================================== */

function CompetencyBars() {
  const competencies = [
    { label: 'C1', value: 180, color: 'var(--primary)' },
    { label: 'C2', value: 160, color: 'var(--accent)' },
    { label: 'C3', value: 140, color: 'var(--warning)' },
    { label: 'C4', value: 170, color: 'var(--primary)' },
    { label: 'C5', value: 150, color: 'var(--accent)' },
  ];

  return (
    <div className="mt-6 space-y-2.5">
      {competencies.map(({ label, value, color }) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-xs font-mono text-[var(--text-muted)] w-6">{label}</span>
          <div className="flex-1 h-2 rounded-full bg-[var(--bg-base)] overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: `${(value / 200) * 100}%`, background: color }}
            />
          </div>
          <span className="text-xs font-mono text-[var(--text-muted)] w-8 text-right">{value}</span>
        </div>
      ))}
      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-[var(--text-muted)]">Total</span>
        <span className="text-sm font-bold text-[var(--accent)]">800/1000</span>
      </div>
    </div>
  );
}

function FeaturesGrid() {
  return (
    <Section className="py-20 md:py-28">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Tudo para sua preparação
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] max-w-xl mx-auto">
            Ferramentas inteligentes que se adaptam ao seu ritmo de estudo.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 max-w-5xl mx-auto">
          {/* Large card — Redação */}
          <div className="
            md:col-span-2 p-6 md:p-8 rounded-2xl
            border border-[var(--border-color)]
            bg-[var(--card-bg)]
            hover:border-[var(--border-color-strong)] hover:shadow-lg
            transition-all duration-[var(--duration-normal)]
            group
          ">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] mb-4">
                  <PenIcon />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Redação com IA</h3>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  Escreva sua redação e receba correção detalhada baseada nas 5 competências
                  oficiais do ENEM. Nota de 0 a 1000 com feedback personalizado.
                </p>
              </div>
              <div className="md:w-64 shrink-0">
                <CompetencyBars />
              </div>
            </div>
          </div>

          {/* Questões */}
          <div className="
            p-6 md:p-8 rounded-2xl
            border border-[var(--border-color)]
            bg-[var(--card-bg)]
            hover:border-[var(--border-color-strong)] hover:shadow-lg
            transition-all duration-[var(--duration-normal)]
          ">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--accent-light)] text-[var(--accent)] mb-4">
              <BrainIcon />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Banco de Questões</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Simulados personalizados por disciplina com questões geradas por IA.
              Pratique no seu ritmo e acompanhe sua evolução.
            </p>
          </div>

          {/* Comunidade */}
          <div className="
            p-6 md:p-8 rounded-2xl
            border border-[var(--border-color)]
            bg-[var(--card-bg)]
            hover:border-[var(--border-color-strong)] hover:shadow-lg
            transition-all duration-[var(--duration-normal)]
          ">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--success-light)] text-[var(--success)] mb-4">
              <UsersIcon />
            </div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Comunidade</h3>
            <p className="text-[var(--text-muted)] leading-relaxed">
              Conecte-se com outros estudantes, tire dúvidas, compartilhe dicas e
              mantenha a motivação em grupo.
            </p>
          </div>

          {/* Wide card — Notícias */}
          <div className="
            md:col-span-2 p-6 md:p-8 rounded-2xl
            border border-[var(--border-color)]
            bg-[var(--card-bg)]
            hover:border-[var(--border-color-strong)] hover:shadow-lg
            transition-all duration-[var(--duration-normal)]
          ">
            <div className="flex items-start gap-4">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--warning-light)] text-[var(--warning)] shrink-0">
                <NewspaperIcon />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Notícias do ENEM</h3>
                  <span className="
                    inline-flex items-center px-2.5 py-0.5 rounded-full
                    text-xs font-medium
                    bg-[var(--accent-light)] text-[var(--accent)]
                  ">
                    Sempre atualizado
                  </span>
                </div>
                <p className="text-[var(--text-muted)] leading-relaxed">
                  Fique por dentro de todas as novidades, datas, editais e mudanças do ENEM.
                  Curadoria automática de notícias relevantes para sua preparação.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  HOW IT WORKS                                                       */
/* ================================================================== */

const STEPS = [
  {
    number: '01',
    title: 'Escolha sua atividade',
    description: 'Redação, simulado ou comunidade — comece pelo que faz mais sentido para você.',
    Icon: TargetIcon,
  },
  {
    number: '02',
    title: 'Pratique e receba feedback',
    description: 'Nossa IA analisa suas respostas e aponta exatamente onde melhorar.',
    Icon: LightbulbIcon,
  },
  {
    number: '03',
    title: 'Acompanhe sua evolução',
    description: 'Dashboards e estatísticas mostram seu progresso real ao longo do tempo.',
    Icon: ChartIcon,
  },
] as const;

function HowItWorks() {
  return (
    <Section id="como-funciona" className="py-20 md:py-28 bg-[var(--bg-surface)]">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] max-w-md mx-auto">
            Três passos simples. Sem complicação.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6 max-w-4xl mx-auto relative">
          {/* Connector line (desktop only) */}
          <div
            className="hidden md:block absolute top-14 left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] h-px bg-[var(--border-color)]"
            aria-hidden="true"
          />

          {STEPS.map(({ number, title, description, Icon }) => (
            <div key={number} className="flex flex-col items-center text-center relative">
              {/* Number badge */}
              <div className="
                flex items-center justify-center w-12 h-12
                rounded-full border-2 border-[var(--primary)]
                bg-[var(--bg-base)]
                text-[var(--primary)] font-bold text-sm
                mb-5 relative z-10
              ">
                {number}
              </div>

              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-[var(--primary-light)] text-[var(--primary)] mb-4">
                <Icon />
              </div>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
              <p className="text-sm text-[var(--text-muted)] leading-relaxed max-w-[260px]">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  TESTIMONIALS                                                       */
/* ================================================================== */

const TESTIMONIALS = [
  {
    name: 'Gabriela S.',
    role: 'Estudante de Medicina',
    initials: 'GS',
    quote:
      'A correção de redação por IA mudou minha forma de estudar. Consigo ver exatamente onde preciso melhorar em cada competência.',
  },
  {
    name: 'Diego M.',
    role: 'Professor',
    initials: 'DM',
    quote:
      'Recomendo para todos os meus alunos. A plataforma é intuitiva e os simulados são muito bem feitos.',
  },
  {
    name: 'Larissa M.',
    role: 'Vestibulanda',
    initials: 'LM',
    quote:
      'A comunidade me ajudou a manter o foco. Estudar junto com outros alunos faz toda a diferença na motivação.',
  },
] as const;

function Testimonials() {
  return (
    <Section className="py-20 md:py-28">
      <div className="container">
        {/* Section header */}
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            O que dizem nossos estudantes
          </h2>
        </div>

        {/* Cards — horizontal scroll on mobile */}
        <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory md:grid md:grid-cols-3 md:overflow-visible md:pb-0 max-w-5xl mx-auto scrollbar-hide">
          {TESTIMONIALS.map(({ name, role, initials, quote }) => (
            <div
              key={name}
              className="
                flex flex-col p-6 rounded-2xl
                border border-[var(--border-color)]
                bg-[var(--card-bg)]
                min-w-[280px] md:min-w-0
                snap-start
                hover:border-[var(--border-color-strong)] hover:shadow-lg
                transition-all duration-[var(--duration-normal)]
              "
            >
              {/* Stars */}
              <div className="flex items-center gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarIcon key={i} />
                ))}
              </div>

              {/* Quote */}
              <blockquote className="flex-1 text-[var(--text-secondary)] leading-relaxed mb-6">
                &ldquo;{quote}&rdquo;
              </blockquote>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-[var(--border-color)]">
                <span className="
                  flex items-center justify-center w-9 h-9
                  rounded-full bg-[var(--primary-light)] text-[var(--primary)]
                  text-xs font-bold select-none
                ">
                  {initials}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{name}</p>
                  <p className="text-xs text-[var(--text-muted)]">{role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  FINAL CTA SECTION                                                  */
/* ================================================================== */

function FinalCTASection() {
  return (
    <Section className="py-20 md:py-28 bg-[var(--bg-surface)]">
      <div className="container flex justify-center">
        <div className="
          relative w-full max-w-2xl text-center
          p-8 md:p-12 rounded-3xl
          border border-[var(--border-color)]
          bg-[var(--card-bg)]
          overflow-hidden
        ">
          {/* Subtle gradient glow behind */}
          <div
            className="absolute inset-0 -z-10 opacity-30 blur-[80px]"
            style={{
              background: 'radial-gradient(ellipse at center, var(--primary) 0%, transparent 70%)',
            }}
            aria-hidden="true"
          />

          <h2 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] tracking-tight">
            Pronto para começar?
          </h2>
          <p className="mt-4 text-lg text-[var(--text-muted)] max-w-md mx-auto mb-8">
            Crie sua conta gratuitamente. Sem cartão de crédito.
          </p>
          <FinalCTA />
        </div>
      </div>
    </Section>
  );
}

/* ================================================================== */
/*  PAGE EXPORT                                                        */
/* ================================================================== */

export default function HomePageClient() {
  return (
    <>
      <HeroSection />
      <SocialProofBar />
      <FeaturesGrid />
      <HowItWorks />
      <Testimonials />
      <FinalCTASection />
    </>
  );
}
