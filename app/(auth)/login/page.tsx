import { Suspense } from 'react';
import LoginForm from './LoginForm';

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10 flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <LoginForm />
    </Suspense>
  );
}
