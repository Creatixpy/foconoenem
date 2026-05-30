import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import RedacaoPageClient from './RedacaoPageClient';

export const dynamic = 'force-dynamic';

export default async function RedacaoPage() {
  const user = await requireServerUser();

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <RedacaoPageClient />
    </AuthProviders>
  );
}
