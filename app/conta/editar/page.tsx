import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import ContaEditarPageClient from './ContaEditarPageClient';

export const dynamic = 'force-dynamic';

export default async function ContaEditarPage() {
  const user = await requireServerUser();

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <ContaEditarPageClient />
    </AuthProviders>
  );
}
