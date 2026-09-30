import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Apoie a AprovIA',
  description: 'Contribua para o acesso à preparação para o ENEM.',
  pathname: '/doacao',
  noIndex: false,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
