import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomeStart() {
  return (
    <section aria-labelledby="home-start-heading" className="py-16 md:py-20">
      <div className="container text-center">
        <h2 id="home-start-heading" className="text-3xl md:text-4xl">
          Comece sua preparação
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-[var(--text-3)]">
          Crie sua conta gratuita e encontre seu próximo passo nos estudos.
        </p>
        <Link
          href="/register"
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-6 py-3 font-semibold text-[var(--text-on-brand)] transition-colors hover:bg-[var(--brand-hover)] hover:text-[var(--text-on-brand)]"
        >
          Criar conta gratuita
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          <Link href="/login" className="font-medium text-[var(--text-2)] hover:text-[var(--text)]">
            Já tenho conta
          </Link>
          <Link href="/planos" className="font-medium text-[var(--text-2)] hover:text-[var(--text)]">
            Conhecer o plano Max
          </Link>
        </div>
      </div>
    </section>
  );
}
