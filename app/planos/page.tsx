import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlanosPageClient from './PlanosPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Planos Free e Max',
  description:
    'Compare o plano gratuito e o plano Max do Foco no ENEM, com IA Max, temas inéditos e assinatura gerenciada pelo Stripe.',
};

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-sm text-[var(--text-muted)]">Carregando planos...</div>}>
      <PlanosPageClient />
    </Suspense>
  );
}
