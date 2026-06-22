import Link from 'next/link';
import AprovIALogo from '@/app/components/shared/AprovIALogo';

const PLATFORM_VIDEO_WATCH_URL = 'https://youtu.be/Tc_VjgQltfc?si=-zgvoZP0ntUq-yRc';

const STATS = [
  { value: '10.000+', label: 'Questões geradas' },
  { value: '500+', label: 'Redações corrigidas' },
  { value: '300+', label: 'Estudantes ativos' },
] as const;

const STEPS = [
  {
    number: '01',
    title: 'Escolha sua atividade',
    description: 'Redação, simulado ou leitura de notícias: comece pelo que faz mais sentido para a sua rotina.',
  },
  {
    number: '02',
    title: 'Pratique com feedback',
    description: 'A plataforma gera questões, corrige redações e aponta onde sua preparação pode evoluir.',
  },
  {
    number: '03',
    title: 'Acompanhe sua evolução',
    description: 'Resultados, histórico e estatísticas ajudam a manter constância ao longo da preparação.',
  },
] as const;

const TESTIMONIALS = [
  {
    name: 'Gabriela S.',
    role: 'Estudante',
    quote:
      'A correção por competências me ajudou a entender com clareza o que precisava melhorar na redação.',
  },
  {
    name: 'Diego M.',
    role: 'Professor',
    quote:
      'Os simulados ficaram mais consistentes e o acompanhamento de desempenho facilita muito a revisão.',
  },
  {
    name: 'Larissa M.',
    role: 'Vestibulanda',
    quote:
      'Os exercícios e o histórico me ajudaram a manter ritmo de estudo sem depender de várias ferramentas separadas.',
  },
] as const;

function ArrowRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.75 9h10.5M9.75 4.5L14.25 9l-4.5 4.5" />
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0-4 4 4 4 0 0 0 2.5 3.7V18a4 4 0 0 0 8 0v-3.3A4 4 0 0 0 20 11a4 4 0 0 0-4-4V6a4 4 0 0 0-4-4z" />
      <path d="M12 2v20" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function NewspaperIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2m0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8M15 18h-5M10 6h8v4h-8z" />
    </svg>
  );
}

function PlatformVideoCover() {
  return (
    <div className="relative aspect-video overflow-hidden bg-[var(--bg)] p-5 sm:p-8">
      <div className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[var(--brand)]/25 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-28 -right-16 h-72 w-72 rounded-full bg-[var(--ai)]/20 blur-3xl" aria-hidden="true" />
      <div className="relative flex h-full flex-col justify-between rounded-2xl border border-white/10 bg-[var(--surface)]/80 p-5 shadow-2xl backdrop-blur-sm sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <AprovIALogo size="sm" />
          <span className="rounded-full border border-[var(--ai)]/30 bg-[var(--ai-soft)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ai)] sm:text-xs">
            Demo
          </span>
        </div>
        <div className="grid grid-cols-[1fr_auto] items-end gap-5">
          <div>
            <p className="font-display text-xl font-extrabold tracking-[-0.03em] text-[var(--text)] sm:text-3xl">
              Estudo guiado por dados e IA
            </p>
            <div className="mt-4 flex items-end gap-2" aria-hidden="true">
              {[40, 64, 50, 82, 72, 94].map((height, index) => (
                <span
                  key={height}
                  className={`w-3 rounded-t-sm ${index % 2 === 0 ? 'bg-[var(--brand)]' : 'bg-[var(--ai)]'}`}
                  style={{ height: `${height / 2}px` }}
                />
              ))}
            </div>
          </div>
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--text)] text-[var(--brand)] shadow-xl transition-transform duration-300 group-hover:scale-105 sm:h-20 sm:w-20">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M8 5.14v14l11-7-11-7Z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePageClient() {
  return (
    <>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[var(--bg)]" />
        <div
          className="absolute left-[10%] top-[-18%] -z-10 h-[28rem] w-[28rem] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'var(--brand)' }}
          aria-hidden="true"
        />
        <div
          className="absolute bottom-[-12%] right-[8%] -z-10 h-[24rem] w-[24rem] rounded-full opacity-15 blur-[110px]"
          style={{ background: 'var(--ai)' }}
          aria-hidden="true"
        />

        <div className="container flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center px-4 py-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--text-2)]">
            <span className="text-[var(--brand)]">✦</span>
            Preparação inteligente para o ENEM
          </span>

          <h1 className="mt-8 max-w-4xl text-4xl font-bold leading-[1.08] tracking-tight text-[var(--text)] sm:text-5xl md:text-6xl lg:text-7xl">
            Sua aprovação, potencializada por <span className="text-[var(--ai)]">IA</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--text-3)] md:text-xl">
            Pratique redação, resolva questões e acompanhe sua evolução com inteligência artificial aplicada à sua rotina de estudos.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-hover)]"
            >
              Começar gratuitamente
              <ArrowRightIcon />
            </Link>
            <Link
              href="/questoes"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-6 py-3 text-base font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
            >
              Ver questões
            </Link>
            <Link
              href="/planos"
              className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand)]/30 bg-[var(--brand-soft)] px-6 py-3 text-base font-semibold text-[var(--brand)] transition-colors hover:border-[var(--brand)]/50 hover:bg-[var(--surface-2)]"
            >
              Conhecer Max
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--border)] bg-[var(--surface)] py-12 md:py-16">
        <div className="container">
          <p className="mb-8 text-center text-sm text-[var(--text-3)]">
            Ferramentas usadas por estudantes que querem consistência
          </p>
          <div className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-bold text-[var(--text)] md:text-3xl">{value}</span>
                <span className="text-sm text-[var(--text-3)]">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
              Tudo para sua preparação
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--text-3)]">
              O foco é concentrar prática, correção e acompanhamento no mesmo lugar.
            </p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
            <article className="group rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-strong)] hover:shadow-lg md:col-span-2 md:p-8">
              <div className="flex flex-col gap-6 md:flex-row md:items-start">
                <div className="flex-1">
                  <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand)]">
                    <PenIcon />
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-[var(--text)]">Redação com IA</h3>
                  <p className="leading-relaxed text-[var(--text-3)]">
                    Gere temas, escreva com tema manual quando quiser e receba correção estruturada nas cinco competências do ENEM.
                  </p>
                </div>
                <div className="md:w-64">
                  <div className="space-y-2.5">
                    {[
                      { label: 'C1', value: '180', width: '90%', color: 'var(--brand)' },
                      { label: 'C2', value: '160', width: '80%', color: 'var(--ai)' },
                      { label: 'C3', value: '140', width: '70%', color: 'var(--warning)' },
                      { label: 'C4', value: '170', width: '85%', color: 'var(--brand)' },
                      { label: 'C5', value: '150', width: '75%', color: 'var(--ai)' },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="w-6 text-xs font-mono text-[var(--text-3)]">{item.label}</span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--bg)]">
                          <div className="h-full rounded-full" style={{ width: item.width, background: item.color }} />
                        </div>
                        <span className="w-8 text-right text-xs font-mono text-[var(--text-3)]">{item.value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-[var(--text-3)]">Total</span>
                      <span className="text-sm font-bold text-[var(--ai)]">800/1000</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-strong)] hover:shadow-lg md:p-8">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--ai-soft)] text-[var(--ai)]">
                <BrainIcon />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--text)]">Banco de questões</h3>
              <p className="leading-relaxed text-[var(--text-3)]">
                O simulado reaproveita questões boas já armazenadas, mistura conteúdo novo e evita repetição excessiva para o mesmo usuário.
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-strong)] hover:shadow-lg md:p-8">
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--success-soft)] text-[var(--success)]">
                <UsersIcon />
              </div>
              <h3 className="mb-2 text-xl font-bold text-[var(--text)]">Conta e histórico</h3>
              <p className="leading-relaxed text-[var(--text-3)]">
                Dashboard com resultados, estatísticas e acompanhamento contínuo da sua preparação ao longo do tempo.
              </p>
            </article>

            <article className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-strong)] hover:shadow-lg md:col-span-2 md:p-8">
              <div className="flex items-start gap-4">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--warning-soft)] text-[var(--warning)]">
                  <NewspaperIcon />
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-xl font-bold text-[var(--text)]">Notícias do ENEM</h3>
                    <span className="inline-flex items-center rounded-full bg-[var(--ai-soft)] px-2.5 py-0.5 text-xs font-medium text-[var(--ai)]">
                      Curadoria publicada
                    </span>
                  </div>
                  <p className="leading-relaxed text-[var(--text-3)]">
                    A área de notícias agora publica conteúdo real no HTML inicial e a busca com IA resume apenas o acervo aprovado da plataforma.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section id="como-funciona" className="bg-[var(--surface)] py-20 md:py-28">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
              Como funciona
            </h2>
            <p className="mx-auto mt-4 max-w-md text-lg text-[var(--text-3)]">
              Fluxo simples para transformar prática em revisão útil.
            </p>
          </div>

          <div className="mx-auto mb-14 max-w-5xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
            <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
              <a
                href={PLATFORM_VIDEO_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative block border-b border-[var(--border)] bg-[var(--bg)] lg:border-b-0 lg:border-r"
                aria-label="Assistir vídeo explicativo da plataforma no YouTube"
              >
                <PlatformVideoCover />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 rounded-2xl border border-white/15 bg-[var(--bg)]/70 px-4 py-3 backdrop-blur-sm">
                  <div>
                    <p className="text-sm font-semibold text-white">Assista à demonstração completa</p>
                    <p className="text-xs text-white/70">O vídeo atual ainda apresenta a identidade anterior</p>
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-3 py-1.5 text-xs font-semibold text-white">
                    Assistir
                    <ArrowRightIcon />
                  </span>
                </div>
              </a>

              <div className="flex flex-col justify-center p-6 sm:p-8">
                <span className="mb-3 inline-flex w-fit items-center rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand)]">
                  Vídeo explicativo
                </span>
                <h3 className="text-2xl font-bold tracking-tight text-[var(--text)]">
                  Veja a plataforma em ação
                </h3>
                <p className="mt-4 leading-relaxed text-[var(--text-3)]">
                  Assista ao passo a passo da redação, dos simulados, das notícias e do acompanhamento de desempenho em um único ambiente.
                </p>
                <a
                  href={PLATFORM_VIDEO_WATCH_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand)] transition-colors hover:text-[var(--brand-hover)]"
                >
                  Abrir no YouTube
                  <ArrowRightIcon />
                </a>
              </div>
            </div>
          </div>

          <div className="relative mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
            <div
              className="absolute left-[calc(16.66%+20px)] right-[calc(16.66%+20px)] top-14 hidden h-px bg-[var(--border)] md:block"
              aria-hidden="true"
            />
            {STEPS.map((step) => (
              <article key={step.number} className="relative flex flex-col items-center text-center">
                <div className="relative z-10 mb-5 flex h-12 w-12 items-center justify-center rounded-full border-2 border-[var(--brand)] bg-[var(--bg)] text-sm font-bold text-[var(--brand)]">
                  {step.number}
                </div>
                <h3 className="mb-2 text-lg font-bold text-[var(--text)]">{step.title}</h3>
                <p className="max-w-[260px] text-sm leading-relaxed text-[var(--text-3)]">{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
              O que dizem nossos estudantes
            </h2>
          </div>

          <div className="mx-auto flex max-w-5xl gap-5 overflow-x-auto pb-4 md:grid md:grid-cols-3 md:overflow-visible md:pb-0">
            {TESTIMONIALS.map((item) => (
              <article
                key={item.name}
                className="flex min-w-[280px] snap-start flex-col rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 transition-all hover:border-[var(--border-strong)] hover:shadow-lg md:min-w-0"
              >
                <div className="mb-4 flex items-center gap-1 text-[var(--warning)]">★★★★★</div>
                <blockquote className="mb-6 flex-1 leading-relaxed text-[var(--text-2)]">
                  &ldquo;{item.quote}&rdquo;
                </blockquote>
                <div className="border-t border-[var(--border)] pt-4">
                  <p className="text-sm font-semibold text-[var(--text)]">{item.name}</p>
                  <p className="text-xs text-[var(--text-3)]">{item.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--surface)] py-20 md:py-28">
        <div className="container flex justify-center">
          <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center md:p-12">
            <div
              className="absolute inset-0 -z-10 opacity-30 blur-[80px]"
              style={{ background: 'radial-gradient(ellipse at center, var(--brand) 0%, transparent 70%)' }}
              aria-hidden="true"
            />
            <h2 className="text-3xl font-bold tracking-tight text-[var(--text)] md:text-4xl">
              Pronto para começar?
            </h2>
            <p className="mx-auto mb-8 mt-4 max-w-md text-lg text-[var(--text-3)]">
              Crie sua conta gratuitamente e concentre redação, questões e acompanhamento no mesmo ambiente.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-[var(--brand-hover)]"
              >
                Criar conta gratuita
                <ArrowRightIcon />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] px-8 py-3.5 text-base font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
              >
                Já tenho conta
              </Link>
              <Link
                href="/planos"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand)]/30 px-8 py-3.5 text-base font-semibold text-[var(--brand)] transition-colors hover:bg-[var(--brand-soft)]"
              >
                Ver Max
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
