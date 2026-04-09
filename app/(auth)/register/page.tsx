import { Suspense } from 'react';
import RegisterForm from './RegisterForm';

function LoadingFallback() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-card-bg rounded-2xl shadow-xl p-8 sm:p-10 flex items-center justify-center min-h-[500px]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RegisterForm />
    </Suspense>
  );
}
