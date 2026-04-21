import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import ResultadosPageClient from './ResultadosPageClient';

export const dynamic = 'force-dynamic';

export default async function ResultadosPage() {
  await requireServerUser();

  return (
    <AuthProviders>
      <ResultadosPageClient />
    </AuthProviders>
  );
}
