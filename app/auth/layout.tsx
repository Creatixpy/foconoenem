import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Autenticação',
  description: 'Acesse sua conta AprovIA.',
  noIndex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
