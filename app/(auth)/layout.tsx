import type { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Autenticação | Foco no ENEM',
  description: 'Acesse sua conta ou crie uma nova para começar a estudar',
  robots: 'noindex, nofollow',
};

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
