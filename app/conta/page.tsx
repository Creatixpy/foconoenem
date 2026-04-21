import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import ContaPageClient from './ContaPageClient';

export const dynamic = 'force-dynamic';

export default async function ContaPage() {
  await requireServerUser();

  return (
    <AuthProviders>
      <ContaPageClient />
    </AuthProviders>
  );
}
