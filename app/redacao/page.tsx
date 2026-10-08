import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import { getUserOperatingHoursInfo } from '@/lib/server/operating-hours';
import RedacaoPageClient from './RedacaoPageClient';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Redação',
  description: 'Escreva sua redação e acompanhe a correção por competências do ENEM.',
  pathname: '/redacao',
  noIndex: true,
});

export const dynamic = 'force-dynamic';

export default async function RedacaoPage() {
  const user = await requireServerUser();
  const operatingHours = await getUserOperatingHoursInfo(user.id);

  return (
    <AuthProviders initialUser={user} initialAuthChecked>
      <RedacaoPageClient operatingHours={operatingHours} />
    </AuthProviders>
  );
}
