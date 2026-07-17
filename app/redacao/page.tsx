import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import RedacaoPageClient from './RedacaoPageClient';

export const dynamic = 'force-dynamic';

export default async function RedacaoPage() {
  const [user, operatingHours] = await Promise.all([
    requireServerUser(),
    getOperatingHoursInfo(),
  ]);

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <RedacaoPageClient operatingHours={operatingHours} />
    </AuthProviders>
  );
}
