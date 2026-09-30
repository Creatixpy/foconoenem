import type { ReactNode } from 'react';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Pesquisar notícias',
  description: 'Pesquise notícias do acervo e peça resumos para estudar.',
  pathname: '/noticias/pesquisa',
  noIndex: true,
});

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
