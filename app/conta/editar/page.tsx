import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import ContaEditarPageClient from './ContaEditarPageClient';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Editar conta',
  description: 'Atualize os dados da sua conta.',
  pathname: '/conta/editar',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function ContaEditarPage() {
  const user = await requireServerUser();

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <ContaEditarPageClient />
    </AuthProviders>
  );
}
