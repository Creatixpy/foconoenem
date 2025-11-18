"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import NewsImage from "@/app/components/NewsImage";
import { useNoticiasFeed, useNoticiasHighlights } from "./hooks";

export function generateMetadata() {
  return {
    title: "Notícias e Atualizações ENEM – Foco no ENEM",
    description:
      "Resumos curtos sobre ENEM e educação para manter seu repertório atualizado. Prazos, temas e comunicados oficiais em um único lugar.",
  };
}

export default function NoticiasPageClient() {
  const [isIaSearching, setIsIaSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaIA, setBuscaIA] = useState("");
  const [pagina, setPagina] = useState(1);
  const [noticiasIA, setNoticiasIA] = useState<string | null>(null);
  const limitePorPagina = 6;
  const feedState = useNoticiasFeed(pagina, limitePorPagina);
  const destaqueState = useNoticiasHighlights(pagina === 1);

  useEffect(() => {
    if (feedState.error) {
      setError(feedState.error);
      return;
    }

    if (destaqueState.error) {
      setError(destaqueState.error);
    }
  }, [feedState.error, destaqueState.error]);

  const buscarComIA = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!buscaIA.trim()) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setIsIaSearching(true);
      setError(null);
      setNoticiasIA(null);

      const response = await fetch("/api/noticias/gpt-busca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo: buscaIA }),
        signal: controller.signal,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar notícias com IA");
      }

      setNoticiasIA(data.noticias);
    } catch (erro) {
      console.error("Erro ao buscar notícias com IA:", erro);
      if (erro instanceof DOMException && erro.name === "AbortError") {
        setError("A busca com IA demorou demais. Tente novamente.");
      } else {
        setError("Não foi possível buscar notícias com IA. Tente novamente mais tarde.");
      }
    } finally {
      clearTimeout(timeoutId);
      setIsIaSearching(false);
    }
  };

  const limparBuscaIA = () => {
    setBuscaIA("");
    setNoticiasIA(null);
    setError(null);
  };

  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  };

  const carregarMais = () => {
    if (feedState.loading) return;
    setPagina((previous) => previous + 1);
  };

  const termoBusca = busca.trim().toLowerCase();
  const filtrando = termoBusca.length > 0;
  const noticiasVisiveis = filtrando
    ? feedState.data.filter(
        (noticia) =>
          noticia.titulo.toLowerCase().includes(termoBusca) ||
          noticia.resumo.toLowerCase().includes(termoBusca) ||
          noticia.tags?.some((tag) => tag.toLowerCase().includes(termoBusca))
      )
    : feedState.data;
  const noticiasDestaque = destaqueState.data;
  const temMaisNoticias = feedState.hasMore;
  const isFeedLoading = feedState.loading;

  return (
    <main className="flex-grow">
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-sm font-semibold text-success shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Atualizado em minutos
                </div>
                <div className="space-y-5">
                  <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                    Notícias do ENEM em formato curto.
                  </h1>
                  <p className="max-w-xl text-lg text-foreground/60">
                    Prazos, temas e comunicados oficiais resumidos para você voltar ao estudo rápido.
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl border-0 bg-card-bg px-5 py-4 shadow-sm">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Cobertura</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">ENEM & Educação</dd>
                    <p className="mt-1 text-xs text-foreground/60">MEC, INEP e temas sociais em uma linha.</p>
                  </div>
                  <div className="rounded-2xl border-0 bg-card-bg px-5 py-4 shadow-sm">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Curadoria</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">Feita por quem estuda</dd>
                    <p className="mt-1 text-xs text-foreground/60">Equipe que vive o vestibular diariamente.</p>
                  </div>
                  <div className="rounded-2xl border-0 bg-card-bg px-5 py-4 shadow-sm">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Busca inteligente</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">IA integrada</dd>
                    <p className="mt-1 text-xs text-foreground/60">Pesquise a web sem sair da página.</p>
                  </div>
                </dl>
              </div>

                <div className="flex h-full flex-col gap-6 rounded-2xl border-0 bg-card-bg p-6 shadow-sm" role="complementary" aria-label="Filtros e busca de notícias">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Filtro rápido</p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Busque em poucas palavras</h2>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Tema, autor ou tag..."
                    className="w-full rounded-xl border-0 bg-muted-bg/50 py-3 pl-12 pr-4 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <details className="rounded-xl border-0 bg-secondary/10 p-4 shadow-sm">
                  <summary className="flex cursor-pointer items-center justify-between gap-2 text-sm font-semibold text-foreground">
                    Busca com IA
                    <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14m7-7H5" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-xs text-foreground/60">Resumos enxutos direto da web quando precisar de algo novo.</p>
                  <form onSubmit={buscarComIA} className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={buscaIA}
                      onChange={(event) => setBuscaIA(event.target.value)}
                      placeholder="Ex.: cronograma ENEM 2025"
                      className="flex-grow rounded-xl border-0 bg-muted-bg/50 px-4 py-3 text-sm text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isIaSearching}
                    />
                    <button
                      type="submit"
                      disabled={isIaSearching || !buscaIA.trim()}
                      className="btn btn-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isIaSearching ? "Buscando..." : "Gerar"}
                    </button>
                  </form>
                  {noticiasIA && (
                    <div className="mt-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-foreground">Resumo da web</p>
                        <button onClick={limparBuscaIA} className="text-xs font-semibold text-primary hover:underline">
                          Limpar
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto rounded-xl border-0 bg-muted-bg/30 p-4 text-sm text-foreground/80">
                        <pre className="whitespace-pre-wrap">{noticiasIA}</pre>
                      </div>
                      <p className="text-xs text-foreground/60">* Conteúdo sintetizado por IA com base em resultados da web.</p>
                    </div>
                  )}
                </details>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-24 sm:px-6 lg:px-8">
          <div className="container mx-auto max-w-6xl space-y-12">
            {error && (
              <div className="rounded-2xl border border-danger/20 bg-danger-light/30 p-4 text-sm text-danger shadow-sm">
                {error}
              </div>
            )}

            {noticiasDestaque.length > 0 && !error && (
              <div className="space-y-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Em destaque</p>
                  <h2 className="text-2xl font-semibold text-foreground">Principais notícias para ficar atento</h2>
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {noticiasDestaque.map((noticia) => (
                    <Link
                      key={noticia.id}
                      href={`/noticias/${noticia.slug}`}
                      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-primary/20 bg-card-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="relative h-56">
                        {noticia.imagem_url ? (
                          <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-primary/10">
                            <svg className="h-12 w-12 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.4} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2M9 5V3m0 2h6m0 0V3m-6 6h6v4H9V9z" />
                            </svg>
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                          Destaque
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{noticia.titulo}</h3>
                        <p className="line-clamp-3 text-sm text-foreground/60">{noticia.resumo}</p>
                        <div className="mt-auto flex items-center justify-between text-xs text-foreground/60">
                          <span>{formatarData(noticia.data_publicacao)}</span>
                          <span>Por {noticia.autor}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <p className="text-xs uppercase tracking-[0.18em] text-primary">Últimas atualizações</p>
                <h2 className="text-2xl font-semibold text-foreground">Fique em dia com o ENEM</h2>
              </div>

              {isFeedLoading && pagina === 1 ? (
                <div className="flex justify-center py-12">
                  <div className="loader" />
                </div>
              ) : noticiasVisiveis.length === 0 ? (
                <div className="flex flex-col items-center gap-4 rounded-2xl border-0 bg-card-bg p-10 text-center shadow-sm">
                  <svg className="h-12 w-12 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M9 5V3m0 2h6m0 0V3m-6 6h6v4H9V9z" />
                  </svg>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">Nenhuma notícia encontrada</h3>
                    <p className="text-sm text-foreground/60">Tente ajustar o termo de busca ou limpar os filtros.</p>
                  </div>
                  {filtrando && (
                    <button onClick={() => setBusca("")} className="btn btn-outline px-4 py-2 text-sm">
                      Limpar busca
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {noticiasVisiveis.map((noticia) => (
                      <Link
                        key={noticia.id}
                        href={`/noticias/${noticia.slug}`}
                        className="group flex h-full flex-col overflow-hidden rounded-2xl border-0 bg-card-bg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                      >
                        <div className="relative h-44">
                          {noticia.imagem_url ? (
                            <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-secondary/20">
                              <svg className="h-10 w-10 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M9 5V3m0 2h6m0 0V3m-6 6h6v4H9V9z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <h3 className="text-lg font-semibold text-foreground line-clamp-2">{noticia.titulo}</h3>
                          <p className="text-sm text-foreground/70 line-clamp-3">{noticia.resumo}</p>
                          <div className="mt-auto flex items-center justify-between text-xs text-foreground/80">
                            <span>{formatarData(noticia.data_publicacao)}</span>
                            <span>Por {noticia.autor}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {!filtrando && temMaisNoticias && (
                    <div className="flex justify-center">
                      <button
                        onClick={carregarMais}
                        disabled={isFeedLoading}
                        className="btn btn-outline px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isFeedLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="inline-block h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                            Carregando...
                          </span>
                        ) : (
                          <>
                            Carregar mais notícias
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M19 9l-7 7-7-7" />
                            </svg>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}
