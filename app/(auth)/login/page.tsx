import { redirect } from 'next/navigation';
import AuthProviders from '@/app/auth-providers';
import { getServerUser } from '@/lib/server/page-auth';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
  const user = await getServerUser();
  if (user) {
    redirect('/conta');
  }

  return (
    <AuthProviders>
      <LoginForm />
    </AuthProviders>
  );
}
