import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import RedacaoPageClient from './RedacaoPageClient';

export const dynamic = 'force-dynamic';

export default async function RedacaoPage() {
  await requireServerUser();

  return (
    <AuthProviders>
      <RedacaoPageClient />
    </AuthProviders>
  );
}
