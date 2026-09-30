'use client';

type SearchFormProps = {
  query: string;
  isAI: boolean;
  setQuery: (value: string) => void;
  setIsAI: (value: boolean) => void;
  submit: () => void;
  secondsToRetry: number;
};

export default function SearchForm({ query, isAI, setQuery, setIsAI, submit, secondsToRetry }: SearchFormProps) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); submit(); }} className="space-y-3" aria-label="Pesquisa de notícias">
      <label htmlFor="news-query" className="sr-only">Pesquisar notícias</label>
      <div className="relative">
        <input id="news-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} required minLength={2} maxLength={200} aria-describedby="news-search-mode" placeholder={isAI ? 'Tema para um resumo com IA…' : 'Buscar notícias…'} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] py-4 pl-4 pr-28 text-base text-[var(--text)] placeholder:text-[var(--text-3)]" />
        <button type="submit" disabled={!query.trim() || secondsToRetry > 0} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-[var(--brand)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">Buscar</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-pressed={isAI} onClick={() => setIsAI(!isAI)} className={`rounded-full border px-4 py-3 text-xs font-medium ${isAI ? 'border-[var(--brand-hover)] bg-[var(--brand-soft)] text-[var(--text)]' : 'border-[var(--border)] bg-[var(--surface)] text-[var(--text-2)]'}`}>
          ✦ Resumo com IA{isAI ? ' ✓' : ''}
        </button>
        <p id="news-search-mode" className="text-xs text-[var(--text-3)]">{isAI ? 'A IA resume notícias aprovadas já publicadas na AprovIA.' : 'Busque no acervo de notícias aprovadas.'}</p>
      </div>
    </form>
  );
}
