import { redirect } from 'next/navigation';
import LoginPageClient from './LoginPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

type LoginPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const redirectTo = sanitizeRedirectPath(searchParams?.next as string | undefined);
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) {
    redirect(redirectTo);
  }

  return <LoginPageClient redirectTo={redirectTo} />;
}
