import AuthProviders from '@/app/auth-providers';
import { requireServerUser } from '@/lib/server/page-auth';
import CommunityPageClient from './CommunityPageClient';

export const dynamic = 'force-dynamic';

export default async function ComunidadePage() {
  await requireServerUser();

  return (
    <AuthProviders>
      <CommunityPageClient />
    </AuthProviders>
  );
}
