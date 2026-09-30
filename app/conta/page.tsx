import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import ContaPageClient from './ContaPageClient';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Minha conta',
  description: 'Acompanhe seu histórico, resultados e assinatura.',
  pathname: '/conta',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function ContaPage() {
  const user = await requireServerUser();

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <ContaPageClient />
    </AuthProviders>
  );
}
