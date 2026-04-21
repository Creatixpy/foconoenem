import { redirect } from 'next/navigation';
import AuthProviders from '@/app/auth-providers';
import { getServerUser } from '@/lib/server/page-auth';
import RegisterForm from './RegisterForm';

export const dynamic = 'force-dynamic';

export default async function RegisterPage() {
  const user = await getServerUser();
  if (user) {
    redirect('/conta');
  }

  return (
    <AuthProviders>
      <RegisterForm />
    </AuthProviders>
  );
}
