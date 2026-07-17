import type { Metadata } from 'next';
import { Suspense } from 'react';
import PlanosPageClient from './PlanosPageClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Planos Free e Max',
  description:
    'Compare os planos gratuito e Max da AprovIA, com temas sob demanda, questões inéditas e assinatura gerenciada pelo Stripe.',
};

export default function PlanosPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-sm text-[var(--text-3)]">Carregando planos...</div>}>
      <PlanosPageClient />
    </Suspense>
  );
}
