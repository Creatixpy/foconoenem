import { ExternalLink, Play } from 'lucide-react';
import AprovIALogo from '@/app/components/shared/AprovIALogo';

const PLATFORM_VIDEO_WATCH_URL = 'https://youtu.be/Tc_VjgQltfc?si=-zgvoZP0ntUq-yRc';

const STEPS = [
  {
    title: 'Escolha sua atividade',
    description: 'Comece por uma redação, um simulado ou pelos conteúdos que deseja revisar.',
  },
  {
    title: 'Pratique com feedback',
    description: 'Use as correções para entender seus acertos e o que pode melhorar.',
  },
  {
    title: 'Acompanhe sua evolução',
    description: 'Revise seu histórico e os resultados para planejar os próximos estudos.',
  },
] as const;

export default function HomeHowItWorks() {
  return (
    <section id="como-funciona" aria-labelledby="home-steps-heading" className="border-y border-[var(--border)] bg-[var(--surface)] py-16 md:py-20">
      <div className="container">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 id="home-steps-heading" className="text-3xl md:text-4xl">
            Como funciona
          </h2>
          <p className="mt-4 text-lg text-[var(--text-3)]">
            Uma rotina simples, do treino à revisão.
          </p>
        </div>

        <ol role="list" className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
          {STEPS.map(({ title, description }, index) => (
            <li key={title}>
              <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand)]" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>
              <h3 className="text-lg">{title}</h3>
              <p className="mt-3 text-sm text-[var(--text-3)]">{description}</p>
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-12 flex max-w-5xl flex-col gap-6 rounded-2xl border border-[var(--border)] bg-[var(--bg)] p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div>
            <AprovIALogo size="sm" />
            <h3 className="mt-4 text-lg">Veja a plataforma em ação</h3>
            <p className="mt-2 text-sm text-[var(--text-3)]">
              Um passo a passo em vídeo. A demonstração ainda apresenta a identidade anterior.
            </p>
          </div>
          <a
            href={PLATFORM_VIDEO_WATCH_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-4 py-3 text-sm font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Play size={16} aria-hidden="true" />
            Assistir no YouTube
            <ExternalLink size={14} aria-hidden="true" />
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
        </div>
      </div>
    </section>
  );
}
