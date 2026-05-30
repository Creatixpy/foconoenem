import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import QuestoesPageClient from './QuestoesPageClient';

export const dynamic = 'force-dynamic';

export default async function QuestoesPage() {
  const user = await requireServerUser();

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <QuestoesPageClient />
    </AuthProviders>
  );
}
