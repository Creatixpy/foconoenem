import { isNewsServerClientConfigured, listNoticias } from '@/lib/server/noticias';
import NoticiasPageClient from './NoticiasPageClient';
import { createPageMetadata } from '@/lib/contracts/page-metadata';

export const metadata = createPageMetadata({
  title: 'Notícias para o ENEM',
  description: 'Leia notícias e reúna repertório para sua preparação e redação.',
  pathname: '/noticias',
});

export default async function NoticiasPage() {
  let initialNoticias: Awaited<ReturnType<typeof listNoticias>> = [];
  let initialDestaques: Awaited<ReturnType<typeof listNoticias>> = [];

  if (isNewsServerClientConfigured()) {
    [initialNoticias, initialDestaques] = await Promise.all([
      listNoticias({ limit: 9, offset: 0 }),
      listNoticias({ limit: 3, offset: 0, destaque: true }).catch(() => []),
    ]);
  }

  return (
    <NoticiasPageClient
      initialNoticias={initialNoticias}
      initialDestaques={initialDestaques}
    />
  );
}
