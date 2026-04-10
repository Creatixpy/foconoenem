'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useNoticia, useRelatedNoticias, type NoticiaAPI } from '../hooks';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function readTime(content: string): string {
  const words = content.split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min de leitura`;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function ArticleImage({ src, alt }: { src: string | null; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full aspect-[21/9] bg-[var(--bg-surface)] flex items-center justify-center">
        <svg className="w-16 h-16 text-[var(--text-muted)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
        </svg>
      </div>
    );
  }
  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover"
        onError={() => setError(true)}
        sizes="100vw"
        priority
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-base)]/60 to-transparent" />
    </div>
  );
}

function RelatedCard({ noticia }: { noticia: NoticiaAPI }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Link href={`/noticias/${noticia.slug}`} className="group block">
      <article className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden hover:border-[var(--border-hover)] transition-colors">
        <div className="relative aspect-[16/9] overflow-hidden bg-[var(--bg-surface)]">
          {noticia.imagem_url && !imgError ? (
            <Image
              src={noticia.imagem_url}
              alt={noticia.titulo}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-8 h-8 text-[var(--text-muted)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4 space-y-1.5">
          <h3 className="text-sm font-semibold text-[var(--text-primary)] line-clamp-2 group-hover:text-[var(--primary)] transition-colors">
            {noticia.titulo}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">{formatDate(noticia.data_publicacao)}</p>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function NoticiaPage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';
  const { noticia, loading, error } = useNoticia(slug);
  const { related } = useRelatedNoticias(noticia?.tags ?? [], slug);
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Loading
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-6 w-32 rounded bg-[var(--bg-surface)]" />
        <div className="aspect-[21/9] rounded-2xl bg-[var(--bg-surface)]" />
        <div className="space-y-3">
          <div className="h-8 w-3/4 rounded bg-[var(--bg-surface)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--bg-surface)]" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 rounded bg-[var(--bg-surface)]" />
          ))}
        </div>
      </div>
    );
  }

  // Error
  if (error || !noticia) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">
          {error || 'Notícia não encontrada'}
        </h2>
        <p className="text-sm text-[var(--text-muted)] mb-6">
          O artigo que você procura não existe ou foi removido.
        </p>
        <Link
          href="/noticias"
          className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline"
        >
          ← Voltar para notícias
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] pb-20">
      {/* hero image */}
      <ArticleImage src={noticia.imagem_url} alt={noticia.titulo} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        {/* back link */}
        <motion.div className="py-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar para notícias
          </Link>
        </motion.div>

        {/* article header */}
        <motion.header
          className="mb-8 space-y-4"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* tags */}
          {noticia.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {noticia.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2.5 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--text-primary)] leading-tight">
            {noticia.titulo}
          </h1>

          {/* meta */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-muted)]">
            {noticia.autor && (
              <>
                <span className="font-medium text-[var(--text-secondary)]">{noticia.autor}</span>
                <span>·</span>
              </>
            )}
            <span>{formatDate(noticia.data_publicacao)}</span>
            <span>·</span>
            <span>{readTime(noticia.conteudo)}</span>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <svg className="w-3.5 h-3.5 text-[var(--success)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Link copiado!
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                  </svg>
                  Compartilhar
                </>
              )}
            </button>
            {noticia.fonte_url && (
              <a
                href={noticia.fonte_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border-color)] text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:border-[var(--border-hover)] transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                Fonte original
              </a>
            )}
          </div>
        </motion.header>

        {/* article body */}
        <motion.article
          className="prose-custom mb-16"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div
            className="text-[var(--text-secondary)] leading-relaxed text-[15px] space-y-4
              [&>p]:mb-4 [&>p:first-child]:text-lg [&>p:first-child]:text-[var(--text-primary)] [&>p:first-child]:font-medium [&>p:first-child]:leading-relaxed
              [&>h1]:text-2xl [&>h1]:font-bold [&>h1]:text-[var(--text-primary)] [&>h1]:mt-8 [&>h1]:mb-4
              [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-[var(--text-primary)] [&>h2]:mt-8 [&>h2]:mb-3
              [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:text-[var(--text-primary)] [&>h3]:mt-6 [&>h3]:mb-2
              [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:space-y-1
              [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:space-y-1
              [&>blockquote]:border-l-2 [&>blockquote]:border-[var(--primary)] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:text-[var(--text-muted)]
              [&_a]:text-[var(--primary)] [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-[var(--primary-hover)]"
            dangerouslySetInnerHTML={{ __html: noticia.conteudo }}
          />
        </motion.article>

        {/* divider */}
        <div className="border-t border-[var(--border-color)] mb-10" />

        {/* related articles */}
        {related.length > 0 && (
          <motion.section
            className="mb-16"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-lg font-bold text-[var(--text-primary)] mb-5">Notícias relacionadas</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {related.map((n) => (
                <RelatedCard key={n.id} noticia={n} />
              ))}
            </div>
          </motion.section>
        )}
      </div>
    </div>
  );
}
