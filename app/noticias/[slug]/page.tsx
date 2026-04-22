import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ShareButton from './ShareButton';
import { fetchNoticiaBySlug, fetchNoticiasPorTag, isReadonlyClientConfigured } from '@/lib/server/noticias';
import { sanitizeExternalUrl, sanitizeNewsHtml } from '@/lib/server/news-content';

type NoticiaPageProps = {
  params: Promise<{ slug: string }>;
};

function stripHtml(html: string | null | undefined): string {
  return (html ?? '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function readTime(content: string): string {
  const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.round(words / 200))} min de leitura`;
}

export async function generateMetadata({ params }: NoticiaPageProps): Promise<Metadata> {
  if (!isReadonlyClientConfigured()) {
    return {
      title: 'Notícia não encontrada | Foco no ENEM',
    };
  }

  const { slug } = await params;
  const noticia = await fetchNoticiaBySlug(slug);

  if (!noticia) {
    return {
      title: 'Notícia não encontrada | Foco no ENEM',
    };
  }

  const description = stripHtml(noticia.resumo || noticia.conteudo).slice(0, 160);
  const imageUrl = sanitizeExternalUrl(noticia.imagem_url);

  return {
    title: noticia.titulo,
    description,
    openGraph: {
      title: noticia.titulo,
      description,
      type: 'article',
      images: imageUrl ? [{ url: imageUrl, alt: noticia.titulo }] : undefined,
    },
  };
}

export default async function NoticiaPage({ params }: NoticiaPageProps) {
  if (!isReadonlyClientConfigured()) {
    notFound();
  }

  const { slug } = await params;
  const noticia = await fetchNoticiaBySlug(slug);

  if (!noticia) {
    notFound();
  }

  const safeImageUrl = sanitizeExternalUrl(noticia.imagem_url);
  const safeSourceUrl = sanitizeExternalUrl(noticia.fonte_url);
  const safeContent = sanitizeNewsHtml(noticia.conteudo);

  let related: Awaited<ReturnType<typeof fetchNoticiasPorTag>> = [];

  if (noticia.tags.length > 0) {
    related = (await fetchNoticiasPorTag(noticia.tags[0], 4))
      .filter((item) => item.slug !== slug)
      .slice(0, 3);
  }

  const relatedItems = related.map((item) => ({
    ...item,
    safeImageUrl: sanitizeExternalUrl(item.imagem_url),
  }));

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="relative overflow-hidden bg-[var(--bg-surface)]">
        {safeImageUrl ? (
          <div className="relative aspect-[21/9] w-full">
            <Image
              src={safeImageUrl}
              alt={noticia.titulo}
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/75 via-[var(--bg-base)]/20 to-transparent" />
          </div>
        ) : (
          <div className="aspect-[21/9] w-full bg-[var(--bg-surface)]" />
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4 py-4 sm:px-6">
        <Link
          href="/noticias"
          className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] transition-colors hover:text-[var(--primary)]"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Voltar para notícias
        </Link>
      </div>

      <article className="mx-auto max-w-3xl px-4 sm:px-6">
        {noticia.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {noticia.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[var(--primary)]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <header className="mb-8 space-y-4">
          <h1 className="text-2xl font-bold leading-tight text-[var(--text-primary)] sm:text-3xl lg:text-4xl">
            {noticia.titulo}
          </h1>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            {noticia.autor ? <span className="font-medium text-[var(--text-secondary)]">{noticia.autor}</span> : null}
            <span>{formatDate(noticia.data_publicacao)}</span>
            <span>·</span>
            <span>{readTime(noticia.conteudo)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ShareButton />
            {safeSourceUrl ? (
              <a
                href={safeSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-color)] px-3 py-1.5 text-xs text-[var(--text-muted)] transition-colors hover:border-[var(--border-hover)] hover:text-[var(--text-secondary)]"
              >
                Fonte original
              </a>
            ) : null}
          </div>
        </header>

        <div
          className="prose prose-neutral max-w-none prose-headings:text-[var(--text-primary)] prose-p:text-[var(--text-secondary)] prose-a:text-[var(--primary)] prose-strong:text-[var(--text-primary)]"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      </article>

      {related.length > 0 && (
        <section className="mx-auto mt-16 max-w-6xl px-4 sm:px-6">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Leituras relacionadas</h2>
            <Link href="/noticias" className="text-sm text-[var(--primary)] transition-colors hover:text-[var(--primary-hover)]">
              Ver todas
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedItems.map((item) => (
              <Link
                key={item.id}
                href={`/noticias/${item.slug}`}
                className="group overflow-hidden rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] transition-colors hover:border-[var(--border-hover)]"
              >
                <div className="relative aspect-[16/9] bg-[var(--bg-surface)]">
                  {item.safeImageUrl ? (
                    <Image
                      src={item.safeImageUrl}
                      alt={item.titulo}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  ) : null}
                </div>
                <div className="space-y-2 p-4">
                  <h3 className="line-clamp-2 text-sm font-semibold text-[var(--text-primary)] transition-colors group-hover:text-[var(--primary)]">
                    {item.titulo}
                  </h3>
                  <p className="line-clamp-2 text-xs text-[var(--text-muted)]">{stripHtml(item.resumo)}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{formatDate(item.data_publicacao)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
