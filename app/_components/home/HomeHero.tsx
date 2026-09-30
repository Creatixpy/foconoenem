import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomeHero() {
  return (
    <section aria-labelledby="home-heading" className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute -left-20 -top-32 h-96 w-96 rounded-full bg-[var(--brand)]/15 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -bottom-32 -right-20 h-80 w-80 rounded-full bg-[var(--ai)]/10 blur-3xl"
        aria-hidden="true"
      />

      <div className="container relative flex flex-col items-center py-20 text-center md:py-28">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--ai)]">
          Preparação para o ENEM
        </p>
        <h1 id="home-heading" className="mt-5 max-w-4xl text-4xl leading-[1.08] sm:text-5xl md:text-6xl lg:text-7xl">
          Sua aprovação, potencializada por <span className="text-[var(--ai)]">IA</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[var(--text-3)] md:text-xl">
          Pratique redação, resolva questões e acompanhe sua evolução em uma rotina de estudos para o ENEM.
        </p>

        <div className="mt-9 flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Link
            href="/register"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-hover)] hover:text-[var(--text-on-brand)] sm:w-auto"
          >
            Começar gratuitamente
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            href="/questoes"
            className="inline-flex w-full items-center justify-center rounded-xl border border-[var(--border)] px-6 py-3 font-semibold text-[var(--text-2)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text)] sm:w-auto"
          >
            Explorar questões
          </Link>
        </div>
      </div>
    </section>
  );
}
