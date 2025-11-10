import { redirect } from 'next/navigation';
import RegisterPageClient from './RegisterPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

type RegisterPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const redirectTo = sanitizeRedirectPath(searchParams?.next as string | undefined);
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect(redirectTo);
  }

  return <RegisterPageClient redirectTo={redirectTo} />;
}
