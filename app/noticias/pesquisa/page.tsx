'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useBuscaNoticias, useBuscaIA, type NoticiaAPI } from '../hooks';

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

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function readTime(content: string): string {
  const words = content.split(/\s+/).length;
  return `${Math.max(1, Math.round(words / 200))} min`;
}

function ResultCard({ noticia }: { noticia: NoticiaAPI }) {
  const [imgError, setImgError] = useState(false);
  return (
    <Link href={`/noticias/${noticia.slug}`} className="group block">
      <article className="flex gap-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 hover:border-[var(--border-hover)] transition-colors">
        <div className="relative w-24 h-24 sm:w-32 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[var(--surface)]">
          {noticia.imagem_url && !imgError ? (
            <Image
              src={noticia.imagem_url}
              alt={noticia.titulo}
              fill
              unoptimized
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="128px"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <svg className="w-6 h-6 text-[var(--text-3)] opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6V7.5z" />
              </svg>
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          {noticia.tags.length > 0 && (
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors">
            {noticia.titulo}
          </h3>
          <p className="text-xs text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-3)]">
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
// Main
// ---------------------------------------------------------------------------
function PesquisaPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const [query, setQuery] = useState(initialQuery);
  const [isAI, setIsAI] = useState(false);
  const { results, loading: searchLoading, searched, search, clear: clearSearch } = useBuscaNoticias();
  const { content: aiContent, loading: aiLoading, error: aiError, search: aiSearch, clear: clearAI } = useBuscaIA();

  // Auto-search on mount if query param present
  useEffect(() => {
    if (initialQuery) search(initialQuery);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (isAI) {
      clearSearch();
      aiSearch(query.trim());
    } else {
      clearAI();
      search(query.trim());
    }
  };

  const loading = searchLoading || aiLoading;

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* header */}
        <motion.div
          className="mb-6 space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link
            href="/noticias"
            className="inline-flex items-center gap-1.5 text-xs text-[var(--text-3)] hover:text-[var(--brand)] transition-colors mb-2"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Voltar para notícias
          </Link>
          <h1 className="text-2xl font-bold text-[var(--text)]">Pesquisar notícias</h1>
        </motion.div>

        {/* search form */}
        <motion.form
          onSubmit={handleSubmit}
          className="mb-8 space-y-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
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
              placeholder={isAI ? 'Peça um resumo das notícias recentes sobre um tema...' : 'Buscar por título ou conteúdo...'}
              className="w-full pl-10 pr-28 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] placeholder:text-[var(--text-3)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm"
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:bg-[var(--brand-hover)] transition-colors disabled:opacity-50 cursor-pointer"
            >
              {loading ? '...' : 'Buscar'}
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsAI(!isAI)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer border ${
              isAI
                ? 'bg-[var(--brand)]/10 text-[var(--brand)] border-[var(--brand)]/30'
                : 'bg-[var(--surface)] text-[var(--text-3)] border-[var(--border)]'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
            </svg>
            Resumo com IA
          </button>
        </motion.form>

        {/* loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        )}

        {/* AI results */}
        {!loading && aiContent && (
          <motion.div
            className="rounded-xl border border-[var(--brand)]/20 bg-[var(--surface)] p-5 sm:p-6 mb-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-4 h-4 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
              <span className="text-xs font-medium text-[var(--brand)]">Resumo da IA</span>
            </div>
            <div className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
              {aiContent}
            </div>
          </motion.div>
        )}

        {aiError && (
          <div className="rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)] mb-6">
            {aiError}
          </div>
        )}

        {/* search results */}
        {!loading && searched && results.length > 0 && (
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-xs text-[var(--text-3)] mb-3">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((n) => (
              <ResultCard key={n.id} noticia={n} />
            ))}
          </motion.div>
        )}

        {/* empty state */}
        {!loading && searched && results.length === 0 && !aiContent && (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-full bg-[var(--surface)] flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <p className="text-[var(--text)] font-medium text-sm mb-1">
              Nenhum resultado encontrado
            </p>
            <p className="text-[var(--text-3)] text-xs mb-4">
              Tente termos diferentes ou peça um resumo com IA baseado nas notícias já publicadas.
            </p>
            {!isAI && (
              <button
                onClick={() => {
                  setIsAI(true);
                  if (query.trim()) {
                    clearSearch();
                    aiSearch(query.trim());
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[var(--brand)] text-white text-sm font-medium hover:bg-[var(--brand-hover)] transition-colors cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
                Gerar resumo com IA
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PesquisaPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-12 animate-pulse space-y-4">
          <div className="h-8 w-48 rounded bg-[var(--surface)]" />
          <div className="h-12 rounded-xl bg-[var(--surface)]" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-[var(--surface)]" />
          ))}
        </div>
      }
    >
      <PesquisaPageInner />
    </Suspense>
  );
}
