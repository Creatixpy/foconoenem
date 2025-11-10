import { redirect } from 'next/navigation';
import RegisterPageClient from './RegisterPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

type SearchParams = Record<string, string | string[] | undefined>;
type RegisterPageProps = {
  searchParams?: Promise<SearchParams>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const redirectTo = sanitizeRedirectPath(resolvedSearchParams?.next as string | undefined);
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect(redirectTo);
  }

  return <RegisterPageClient redirectTo={redirectTo} />;
}
