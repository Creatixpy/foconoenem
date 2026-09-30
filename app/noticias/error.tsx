'use client';

import { startTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import FlowStatus from '@/app/components/shared/FlowStatus';

export default function NoticiasError({ reset, unstable_retry }: { reset: () => void; unstable_retry?: () => void }) {
  const router = useRouter();
  const retry = () => {
    if (unstable_retry) unstable_retry();
    else startTransition(() => { router.refresh(); reset(); });
  };
  return (
    <div className="student-flow mx-auto min-h-[60vh] max-w-3xl space-y-5 px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--text)]">Não foi possível abrir as notícias</h1>
      <FlowStatus error>O conteúdo está temporariamente indisponível. Tente novamente em instantes.</FlowStatus>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={retry} className="rounded-lg bg-[var(--brand)] px-5 py-3 text-sm font-medium text-white">Tentar novamente</button>
        <Link href="/noticias" className="rounded-lg border border-[var(--border)] px-5 py-3 text-sm text-[var(--text-2)]">Voltar para notícias</Link>
      </div>
    </div>
  );
}
