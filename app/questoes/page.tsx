import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import QuestoesPageClient from './QuestoesPageClient';

export const dynamic = 'force-dynamic';

export default async function QuestoesPage() {
  const [user, operatingHours] = await Promise.all([
    requireServerUser(),
    getOperatingHoursInfo(),
  ]);

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <QuestoesPageClient operatingHours={operatingHours} />
    </AuthProviders>
  );
}
