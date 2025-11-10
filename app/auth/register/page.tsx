import { redirect } from 'next/navigation';
import RegisterPageClient from './RegisterPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

type SearchParams = Record<string, string | string[] | undefined>;
type RegisterPageProps = {
  searchParams?: SearchParams | Promise<SearchParams>;
};

function isPromise<T = unknown>(value: unknown): value is Promise<T> {
  return typeof value === 'object' && value !== null && 'then' in value;
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = isPromise(searchParams) ? await searchParams : searchParams;
  const redirectTo = sanitizeRedirectPath(resolvedSearchParams?.next as string | undefined);
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect(redirectTo);
  }

  return <RegisterPageClient redirectTo={redirectTo} />;
}
