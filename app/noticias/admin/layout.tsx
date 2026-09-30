import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Administração de notícias',
  description: 'Administração do acervo de notícias.',
  pathname: '/noticias/admin',
  noIndex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
