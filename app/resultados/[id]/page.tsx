import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import ResultadosPageClient from './ResultadosPageClient';
import { sanitizeRedirectPath } from '@/lib/security';


type ResultadosPageProps = {
  params: Promise<{ id: string } | { [key: string]: string }> | { id: string } | { [key: string]: string };
};

function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return typeof value === 'object' && value !== null && 'then' in value;
}

export default async function ResultadosPage({ params }: ResultadosPageProps) {
  const resolvedParams = isPromise(params) ? await params : params;
  const id = typeof resolvedParams === 'object' && 'id' in resolvedParams ? resolvedParams.id : undefined;
  if (!id || typeof id !== 'string') {
    redirect('/');
  }
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const safeNext = sanitizeRedirectPath(`/resultados/${id}`);
    redirect(`/auth/login?next=${encodeURIComponent(safeNext)}`);
  }

  return <ResultadosPageClient essayId={id} />;
}
