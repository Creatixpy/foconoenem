'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNoticias, useDestaques, type NoticiaAPI } from './hooks';
import { useNewsSearch } from './useNewsSearch';
import SearchForm from './SearchForm';
import FlowStatus from '@/app/components/shared/FlowStatus';

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

// ---------------------------------------------------------------------------
// NewsImage — handles image with fallback
// ---------------------------------------------------------------------------
function NewsImage({
  src,
  alt,
  fill = false,
  className = '',
}: {
  src: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const fallback = (
    <div
      className={`flex items-center justify-center bg-[var(--surface)] ${className}`}
      style={fill ? { position: 'absolute', inset: 0 } : {}}
    >
      <svg className="w-12 h-12 text-[var(--text-3)] opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
      </svg>
    </div>
  );

  if (!src || error) return fallback;

  return fill ? (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized
      className={`object-cover ${className}`}
      onError={() => setError(true)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  ) : (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={450}
      unoptimized
      className={`object-cover ${className}`}
      onError={() => setError(true)}
    />
  );
}

// ---------------------------------------------------------------------------
// Article card variants
// ---------------------------------------------------------------------------
function ArticleCardSmall({ noticia }: { noticia: NoticiaAPI }) {
  return (
    <Link href={`/noticias/${noticia.slug}`} className="group block">
      <article
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
      >
        <div className="relative aspect-[16/9] overflow-hidden">
          <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-4 space-y-2">
          {noticia.tags.length > 0 && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-hover)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors leading-snug">
            {noticia.titulo}
          </h3>
          <p className="text-xs text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-3)] pt-1">
            <span>{formatDate(noticia.data_publicacao)}</span>
            <span>·</span>
            <span>{readTime(noticia.conteudo)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function ArticleCardMedium({ noticia }: { noticia: NoticiaAPI }) {
  return (
    <Link href={`/noticias/${noticia.slug}`} className="group block">
      <article
        className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden hover:border-[var(--border-hover)] transition-colors h-full"
      >
        <div className="relative aspect-[16/10] overflow-hidden">
          <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill />
        </div>
        <div className="p-5 space-y-2">
          {noticia.tags.length > 0 && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-hover)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-base font-bold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors">
            {noticia.titulo}
          </h3>
          <p className="text-sm text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-3)] pt-1">
            <span>{formatDate(noticia.data_publicacao)}</span>
            <span>·</span>
            <span>{readTime(noticia.conteudo)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
function NoticiasContent({
  initialNoticias,
  initialDestaques,
}: {
  initialNoticias: NoticiaAPI[];
  initialDestaques: NoticiaAPI[];
}) {
  const { noticias, loading, loadingMore, error, moreError, hasMore, loadMore, refetch } = useNoticias(9, initialNoticias);
  const { destaques, loading: destaquesLoading, error: highlightsError, refresh: refreshHighlights } = useDestaques(3, initialDestaques);
  const searchState = useNewsSearch();
  const { results: searchResults, loading: searchLoading, searched, error: searchError, aiContent, showingSearch, showingAI, submit, clearResults: handleClearResults, secondsToRetry } = searchState;

  const heroArticle = destaques[0];
  const secondaryArticles = destaques.slice(1, 3);

  return (
    <div className="student-flow min-h-[80vh] pb-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* page header */}
        <div className="mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-3)]">
            <span className="text-[var(--brand)]">✦</span>
            Notícias
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text)]">
            Notícias do ENEM
          </h1>
          <p className="text-[var(--text-3)] text-sm max-w-xl">
            Fique por dentro das últimas notícias sobre o ENEM, vestibulares e educação no Brasil.
          </p>
        </div>

        {/* search */}
        <div className="mb-10">
          <SearchForm {...searchState} />
        </div>

        {/* search results */}
        {(showingSearch || showingAI) && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                {showingAI && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand-hover)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                    </svg>
                    IA
                  </span>
                )}
                Resultados da busca
              </h2>
              <button
                onClick={handleClearResults}
                className="text-xs text-[var(--text-3)] hover:text-[var(--brand)] transition-colors cursor-pointer"
              >
                Limpar busca
              </button>
            </div>

            {searchLoading && (
              <div className="space-y-4" role="status" aria-label="Buscando notícias">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-[var(--surface)] animate-pulse" />
                ))}
              </div>
            )}

            {showingAI && !searchLoading && !searchError && aiContent && (
              <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--surface)] p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="text-xs font-medium text-[var(--brand-hover)]">Resumo da IA</span>
                </div>
                <div className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                  {aiContent}
                </div>
              </div>
            )}

            {searchError && <div className="space-y-3">
              <FlowStatus error>{searchError}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus>
              <button type="button" disabled={secondsToRetry > 0} onClick={() => submit()} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] disabled:opacity-50">Tentar novamente</button>
            </div>}
            {showingAI && searched && !searchLoading && !searchError && !aiContent && <FlowStatus>Nenhuma notícia encontrada para resumir. Tente outro termo.</FlowStatus>}

            {showingSearch && searched && !searchLoading && !searchError && searchResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-3)] text-sm mb-2">Nenhum resultado encontrado.</p>
                <p className="text-[var(--text-3)] text-xs">
                  Peça um{' '}
                  <button
                    onClick={() => submit(searchState.query, true)}
                    className="text-[var(--brand-hover)] hover:underline cursor-pointer"
                  >
                    resumo com IA
                  </button>{' '}
                  com base nas notícias publicadas.
                </p>
              </div>
            )}

            {showingSearch && !searchLoading && !searchError && searchResults.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchResults.map((n) => (
                  <ArticleCardSmall key={n.id} noticia={n} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* featured hero */}
        {!showingSearch && !showingAI && (
          <>
            {highlightsError && <div className="mb-5 space-y-3"><FlowStatus error>Não foi possível atualizar os destaques.</FlowStatus><button type="button" onClick={() => void refreshHighlights()} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)]">Tentar atualizar destaques</button></div>}
            {destaquesLoading ? (
              <div className="mb-10 space-y-4" role="status" aria-label="Carregando destaques">
                <span className="sr-only">Carregando destaques…</span>
                <div className="h-[400px] rounded-2xl bg-[var(--surface)] animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-[260px] rounded-xl bg-[var(--surface)] animate-pulse" />
                  <div className="h-[260px] rounded-xl bg-[var(--surface)] animate-pulse" />
                </div>
              </div>
            ) : heroArticle ? (
              <div className="mb-10 space-y-4">
                {/* hero card */}
                <Link href={`/noticias/${heroArticle.slug}`} className="group block">
                  <article className="relative rounded-2xl overflow-hidden h-[360px] sm:h-[420px]">
                    <NewsImage src={heroArticle.imagem_url} alt={heroArticle.titulo} fill className="transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 space-y-3">
                      {heroArticle.tags.length > 0 && (
                        <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-white/90 bg-white/15 backdrop-blur-sm px-2.5 py-1 rounded-full">
                          {heroArticle.tags[0]}
                        </span>
                      )}
                      <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight line-clamp-2">
                        {heroArticle.titulo}
                      </h2>
                      <p className="text-sm text-white/75 line-clamp-2 max-w-2xl">
                        {stripHtml(heroArticle.resumo)}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
                        <span>{formatDate(heroArticle.data_publicacao)}</span>
                        <span>·</span>
                        <span>{readTime(heroArticle.conteudo)}</span>
                        <span className="ml-auto text-white/80 group-hover:text-white transition-colors">
                          Ler mais →
                        </span>
                      </div>
                    </div>
                  </article>
                </Link>

                {/* secondary highlights */}
                {secondaryArticles.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {secondaryArticles.map((n) => (
                      <ArticleCardMedium key={n.id} noticia={n} />
                    ))}
                  </div>
                )}
              </div>
            ) : null}

            {/* divider */}
            <div className="border-t border-[var(--border)] mb-8" />

            {/* news grid */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[var(--text)] mb-5">Últimas notícias</h2>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" role="status" aria-label="Carregando notícias">
                  <span className="sr-only">Carregando notícias…</span>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="rounded-xl bg-[var(--surface)] animate-pulse">
                      <div className="aspect-[16/9]" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 w-16 rounded bg-[var(--surface-2)]" />
                        <div className="h-4 w-full rounded bg-[var(--surface-2)]" />
                        <div className="h-3 w-3/4 rounded bg-[var(--surface-2)]" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : error && noticias.length === 0 ? (
                <div className="text-center py-12">
                  <FlowStatus error>{error}</FlowStatus>
                  <button
                    onClick={refetch}
                    className="mt-3 text-sm text-[var(--brand-hover)] hover:underline cursor-pointer"
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : noticias.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
                    </svg>
                  </div>
                  <p className="text-[var(--text-3)] text-sm">Nenhuma notícia disponível no momento.</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {noticias.map((n) => (
                      <ArticleCardSmall key={n.id} noticia={n} />
                    ))}
                  </div>

                  {moreError && <div className="mt-5"><FlowStatus error>{moreError} As notícias carregadas foram mantidas.</FlowStatus></div>}
                  {loadingMore && <p role="status" className="sr-only">Carregando mais notícias…</p>}
                  {hasMore && (
                    <div className="text-center mt-8">
                      <button
                        onClick={loadMore}
                        disabled={loadingMore}
                        className="px-6 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-sm font-medium text-[var(--text-2)] hover:bg-[var(--surface)] hover:border-[var(--border-hover)] transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        {loadingMore ? (
                          <span className="inline-flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Carregando...
                          </span>
                        ) : (
                          moreError ? 'Tentar carregar mais novamente' : 'Carregar mais'
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function NoticiasPageClient(props: { initialNoticias: NoticiaAPI[]; initialDestaques: NoticiaAPI[] }) {
  return <Suspense fallback={<div className="mx-auto max-w-6xl px-4 py-10"><FlowStatus>Carregando notícias…</FlowStatus></div>}><NoticiasContent {...props} /></Suspense>;
}
