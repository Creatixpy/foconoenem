import { redirect } from 'next/navigation';
import ContaPageClient from './ContaPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

export default async function ContaPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const next = sanitizeRedirectPath('/conta');
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  return <ContaPageClient />;
}
