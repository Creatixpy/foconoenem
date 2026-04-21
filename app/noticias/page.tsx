import { isReadonlyClientConfigured, listNoticias } from '@/lib/server/noticias';
import NoticiasPageClient from './NoticiasPageClient';

export default async function NoticiasPage() {
  let initialNoticias: Awaited<ReturnType<typeof listNoticias>> = [];
  let initialDestaques: Awaited<ReturnType<typeof listNoticias>> = [];

  if (isReadonlyClientConfigured()) {
    [initialNoticias, initialDestaques] = await Promise.all([
      listNoticias({ limit: 9, offset: 0 }),
      listNoticias({ limit: 3, offset: 0, destaque: true }),
    ]);
  }

  return (
    <NoticiasPageClient
      initialNoticias={initialNoticias}
      initialDestaques={initialDestaques}
    />
  );
}
