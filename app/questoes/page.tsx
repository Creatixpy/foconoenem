import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import { getUserOperatingHoursInfo } from '@/lib/server/operating-hours';
import QuestoesPageClient from './QuestoesPageClient';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Questões',
  description: 'Pratique com simulados e acompanhe suas respostas e resultados.',
  pathname: '/questoes',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function QuestoesPage() {
  const user = await requireServerUser();
  const operatingHours = await getUserOperatingHoursInfo(user.id);

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <QuestoesPageClient operatingHours={operatingHours} />
    </AuthProviders>
  );
}
