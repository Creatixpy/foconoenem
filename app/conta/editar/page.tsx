import { redirect } from 'next/navigation';
import ContaEditarPageClient from './ContaEditarPageClient';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { sanitizeRedirectPath } from '@/lib/security';

export default async function EditarContaPage() {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    const next = sanitizeRedirectPath('/conta/editar');
    redirect(`/auth/login?next=${encodeURIComponent(next)}`);
  }

  return <ContaEditarPageClient />;
}
