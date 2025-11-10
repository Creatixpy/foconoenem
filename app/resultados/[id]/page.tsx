import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ResultadosPageClient from './ResultadosPageClient';
import { sanitizeRedirectPath } from '@/lib/security';

type ResultadosPageProps = {
  params: { id: string };
};

export default async function ResultadosPage({ params }: ResultadosPageProps) {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const safeNext = sanitizeRedirectPath(`/resultados/${params.id}`);
    redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`);
  }

  return <ResultadosPageClient essayId={params.id} />;
}
