import { notFound } from 'next/navigation';
import { getEssayById } from '@/lib/db/repositories/essays';
import { createAdminClient } from '@/lib/db/server';
import { requireServerUser } from '@/lib/server/page-auth';
import ResultadosPageClient from './ResultadosPageClient';

export const dynamic = 'force-dynamic';

export default async function ResultadosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [user, { id }] = await Promise.all([requireServerUser(), params]);
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    notFound();
  }

  const adminClient = createAdminClient();
  if (!adminClient) throw new Error('Supabase service role não configurado.');

  const result = await getEssayById(adminClient, id, user.id);
  if (!result) notFound();

  return <ResultadosPageClient result={result} />;
}
