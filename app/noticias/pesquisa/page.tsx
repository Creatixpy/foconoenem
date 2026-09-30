'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { NoticiaAPI } from '../hooks';
import { useNewsSearch } from '../useNewsSearch';
import SearchForm from '../SearchForm';
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
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-[var(--brand-hover)] bg-[var(--brand)]/10 px-2 py-0.5 rounded-full">
              {noticia.tags[0]}
            </span>
          )}
          <h3 className="text-sm font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand)] transition-colors">
            {noticia.titulo}
          </h3>
          <p className="text-xs text-[var(--text-3)] line-clamp-2">{stripHtml(noticia.resumo)}</p>
          <div className="flex flex-wrap items-center gap-2 text-[10px] text-[var(--text-3)]">
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
  const searchState = useNewsSearch();
  const { results, aiContent, loading, error, searched, showingAI, showingSearch, submit, clearResults, secondsToRetry } = searchState;

  return (
    <div className="student-flow min-h-[80vh] pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* header */}
        <div
          className="mb-6 space-y-2"
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
        </div>

        <div className="mb-8"><SearchForm {...searchState} /></div>
        {(showingSearch || showingAI) && <button type="button" onClick={clearResults} className="mb-4 rounded-lg border border-[var(--border)] px-4 py-3 text-xs text-[var(--text-2)]">Limpar busca</button>}

        {/* loading */}
        {loading && (
          <div role="status" aria-label="Buscando notícias" className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-xl bg-[var(--surface)] animate-pulse" />
            ))}
          </div>
        )}

        {/* AI results */}
        {!loading && showingAI && !error && aiContent && (
          <div
            className="rounded-xl border border-[var(--brand)]/20 bg-[var(--surface)] p-5 sm:p-6 mb-6"
          >
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

        {error && <div className="mb-6 space-y-3"><FlowStatus error>{error}{secondsToRetry > 0 && ` Aguarde ${secondsToRetry}s.`}</FlowStatus><button type="button" disabled={secondsToRetry > 0} onClick={() => submit()} className="rounded-lg border border-[var(--border)] px-4 py-3 text-sm text-[var(--text)] disabled:opacity-50">Tentar novamente</button></div>}
        {!loading && showingAI && searched && !error && !aiContent && <FlowStatus>Nenhuma notícia encontrada para resumir. Tente outro termo.</FlowStatus>}

        {/* search results */}
        {!loading && showingSearch && searched && !error && results.length > 0 && (
          <div
            className="space-y-3"
          >
            <p className="text-xs text-[var(--text-3)] mb-3">
              {results.length} resultado{results.length !== 1 ? 's' : ''} encontrado{results.length !== 1 ? 's' : ''}
            </p>
            {results.map((n) => (
              <ResultCard key={n.id} noticia={n} />
            ))}
          </div>
        )}

        {/* empty state */}
        {!loading && showingSearch && searched && !error && results.length === 0 && (
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
            {showingSearch && (
              <button
                onClick={() => submit(searchState.query, true)}
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
