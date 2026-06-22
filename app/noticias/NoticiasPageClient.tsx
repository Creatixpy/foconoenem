'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useNoticias, useDestaques, useBuscaNoticias, useBuscaIA, type NoticiaAPI } from './hooks';

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
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors leading-snug">
            {noticia.titulo}
          </h3>
          <p className="text-xs text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)] pt-1">
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
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-base font-bold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors">
            {noticia.titulo}
          </h3>
          <p className="text-sm text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex items-center gap-2 text-xs text-[var(--text-3)] pt-1">
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
// Search bar
// ---------------------------------------------------------------------------
function SearchBar({
  onSearch,
  onAISearch,
}: {
  onSearch: (q: string) => void;
  onAISearch: (q: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [isAI, setIsAI] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (isAI) onAISearch(query.trim());
    else onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="relative">
        <svg
          className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-[var(--text-3)]"
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={isAI ? 'Peça um resumo das notícias recentes sobre um tema...' : 'Buscar notícias...'}
          className="w-full pl-10 pr-28 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
        >
          Buscar
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsAI(!isAI)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
            isAI
              ? 'bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/30'
              : 'bg-[var(--surface)] text-[var(--text-3)] border-[var(--border)] hover:text-[var(--text-2)]'
          }`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          Resumo com IA
        </button>
        {isAI && (
          <span className="text-[10px] text-[var(--text-3)]">
            A IA resume notícias aprovadas já publicadas na AprovIA
          </span>
        )}
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function NoticiasPageClient({
  initialNoticias,
  initialDestaques,
}: {
  initialNoticias: NoticiaAPI[];
  initialDestaques: NoticiaAPI[];
}) {
  const { noticias, loading, loadingMore, error, hasMore, loadMore } = useNoticias(9, initialNoticias);
  const { destaques, loading: destaquesLoading } = useDestaques(3, initialDestaques);
  const { results: searchResults, loading: searchLoading, searched, search, clear: clearSearch } = useBuscaNoticias();
  const { content: aiContent, loading: aiLoading, error: aiError, search: aiSearch, clear: clearAI } = useBuscaIA();

  const [showingSearch, setShowingSearch] = useState(false);
  const [showingAI, setShowingAI] = useState(false);

  const handleSearch = useCallback(
    (q: string) => {
      clearAI();
      setShowingAI(false);
      search(q);
      setShowingSearch(true);
    },
    [search, clearAI]
  );

  const handleAISearch = useCallback(
    (q: string) => {
      clearSearch();
      setShowingSearch(false);
      aiSearch(q);
      setShowingAI(true);
    },
    [aiSearch, clearSearch]
  );

  const handleClearResults = useCallback(() => {
    clearSearch();
    clearAI();
    setShowingSearch(false);
    setShowingAI(false);
  }, [clearSearch, clearAI]);

  const heroArticle = destaques[0];
  const secondaryArticles = destaques.slice(1, 3);

  return (
    <div className="min-h-[80vh] pb-20">
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
          <SearchBar onSearch={handleSearch} onAISearch={handleAISearch} />
        </div>

        {/* search results */}
        {(showingSearch || showingAI) && (
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[var(--text)] flex items-center gap-2">
                {showingAI && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--brand)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
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

            {(searchLoading || aiLoading) && (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 rounded-xl bg-[var(--surface)] animate-pulse" />
                ))}
              </div>
            )}

            {showingAI && aiContent && (
              <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--surface)] p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  <span className="text-xs font-medium text-[var(--brand)]">Resumo da IA</span>
                </div>
                <div className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                  {aiContent}
                </div>
              </div>
            )}

            {showingAI && aiError && (
              <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
                {aiError}
              </div>
            )}

            {showingSearch && searched && !searchLoading && searchResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-[var(--text-3)] text-sm mb-2">Nenhum resultado encontrado.</p>
                <p className="text-[var(--text-3)] text-xs">
                  Tente a{' '}
                  <button
                    onClick={() => setShowingSearch(false)}
                    className="text-[var(--brand)] hover:underline cursor-pointer"
                  >
                    resumo com IA
                  </button>{' '}
                  para uma resposta personalizada.
                </p>
              </div>
            )}

            {showingSearch && searchResults.length > 0 && (
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
            {destaquesLoading ? (
              <div className="mb-10 space-y-4">
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
                      <div className="flex items-center gap-3 text-xs text-white/60">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-[var(--danger)] text-sm mb-3">{error}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="text-sm text-[var(--brand)] hover:underline cursor-pointer"
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
                          'Carregar mais'
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
