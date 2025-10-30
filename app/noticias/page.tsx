"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import NewsImage from "@/app/components/NewsImage";
import { Noticia } from "@/types";
import { getNoticias, getNoticiasDestaque } from "@/lib/supabase";

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiasDestaque, setNoticiasDestaque] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [buscaIA, setBuscaIA] = useState("");
  const [pagina, setPagina] = useState(1);
  const [temMaisNoticias, setTemMaisNoticias] = useState(true);
  const [noticiasIA, setNoticiasIA] = useState<string | null>(null);
  const limitePorPagina = 6;

  useEffect(() => {
    const carregarNoticias = async () => {
      try {
        setIsLoading(true);

        if (pagina === 1) {
          const destaques = await getNoticiasDestaque();
          setNoticiasDestaque(destaques);
        }

        const offset = (pagina - 1) * limitePorPagina;
        const resultado = await getNoticias(limitePorPagina, offset);

        if (pagina === 1) {
          setNoticias(resultado);
        } else {
          setNoticias((previous) => [...previous, ...resultado]);
        }

        setTemMaisNoticias(resultado.length === limitePorPagina);
      } catch (erro) {
        console.error("Erro ao carregar notícias:", erro);
        setError("Não foi possível carregar as notícias. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    void carregarNoticias();
  }, [pagina]);

  const buscarComIA = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!buscaIA.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      setNoticiasIA(null);

      const response = await fetch("/api/noticias/gpt-busca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termo: buscaIA }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Erro ao buscar notícias com IA");
      }

      setNoticiasIA(data.noticias);
    } catch (erro) {
      console.error("Erro ao buscar notícias com IA:", erro);
      setError("Não foi possível buscar notícias com IA. Tente novamente mais tarde.");
    } finally {
      setIsLoading(false);
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

  const carregarMais = () => setPagina((previous) => previous + 1);

  const termoBusca = busca.trim().toLowerCase();
  const filtrando = termoBusca.length > 0;
  const noticiasVisiveis = filtrando
    ? noticias.filter(
        (noticia) =>
          noticia.titulo.toLowerCase().includes(termoBusca) ||
          noticia.resumo.toLowerCase().includes(termoBusca) ||
          noticia.tags?.some((tag) => tag.toLowerCase().includes(termoBusca))
      )
    : noticias;

  return (
    <div className="flex min-h-screen flex-col bg-page-gradient text-foreground">
      <Header />

      <main className="flex-grow">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto max-w-6xl">
            <div className="grid gap-12 lg:grid-cols-[1.2fr_0.9fr]">
              <div className="space-y-8">
                <div className="hero-status shadow-glow">
                  <span className="h-2 w-2 rounded-full bg-success" />
                  Atualizado diariamente
                </div>
                <div className="space-y-5">
                  <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl">
                    Notícias e atualidades para a redação e questões do ENEM.
                  </h1>
                  <p className="max-w-xl text-lg text-foreground/75">
                    Acompanhe mudanças no exame, prazos importantes, temas em alta e orientações exclusivas para construir
                    repertório sociocultural com confiança.
                  </p>
                </div>
                <dl className="grid gap-4 sm:grid-cols-3">
                  <div className="stat-card px-5 py-4">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Cobertura</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">ENEM & Educação</dd>
                    <p className="mt-1 text-xs text-foreground/60">Atualizações oficiais, MEC/INEP e temas sociais</p>
                  </div>
                  <div className="stat-card px-5 py-4">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Curadoria</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">Feita por quem estuda</dd>
                    <p className="mt-1 text-xs text-foreground/60">Equipe que vive o vestibular diariamente</p>
                  </div>
                  <div className="stat-card px-5 py-4">
                    <dt className="text-xs uppercase tracking-wide text-foreground/60">Busca inteligente</dt>
                    <dd className="mt-2 text-xl font-semibold text-primary">IA integrada</dd>
                    <p className="mt-1 text-xs text-foreground/60">Pesquise a web em tempo real sem sair da plataforma</p>
                  </div>
                </dl>
              </div>

              <div className="surface-card flex h-full flex-col gap-6 p-6 shadow-xl">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Fique por dentro</p>
                  <h2 className="mt-2 text-lg font-semibold text-foreground">Busque notícias rapidamente</h2>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Pesquisar nas notícias publicadas aqui..."
                    className="w-full rounded-2xl border border-border-color/60 bg-card-bg/80 py-3 pl-12 pr-4 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <svg
                    className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground/40"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div className="rounded-2xl border border-border-color/60 bg-card-bg/80 p-4 shadow-inner backdrop-blur">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Busca inteligente com IA</p>
                      <p className="text-xs text-foreground/60">
                        Pesquise na web por novidades sobre o ENEM e receba um resumo contextualizado.
                      </p>
                    </div>
                    <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <form onSubmit={buscarComIA} className="mt-4 flex gap-2">
                    <input
                      type="text"
                      value={buscaIA}
                      onChange={(event) => setBuscaIA(event.target.value)}
                      placeholder="Ex.: mudanças na redação ENEM 2024"
                      className="flex-grow rounded-2xl border border-border-color/60 bg-card-bg/80 px-4 py-3 text-sm text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                      disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={isLoading || !buscaIA.trim()}
                      className="btn btn-primary px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Buscando...
                        </span>
                      ) : (
                        <>
                          Buscar com IA
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.6} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </>
                      )}
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
                      <div className="max-h-72 overflow-y-auto rounded-2xl border border-border-color/60 bg-muted-bg/60 p-4 text-sm text-foreground/80">
                        <pre className="whitespace-pre-wrap">{noticiasIA}</pre>
                      </div>
                      <p className="text-xs text-foreground/50">* Conteúdo sintetizado por IA com base em resultados da web.</p>
                    </div>
                  )}
                </div>
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
                      className="surface-card group flex h-full flex-col overflow-hidden border border-primary/20 shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
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
                        <span className="hero-status absolute left-4 top-4 border border-white/60 bg-white/80 text-xs font-semibold text-primary shadow-glow">
                          Destaque
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col gap-3 p-5">
                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">{noticia.titulo}</h3>
                        <p className="line-clamp-3 text-sm text-foreground/70">{noticia.resumo}</p>
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

              {isLoading && pagina === 1 ? (
                <div className="flex justify-center py-12">
                  <div className="loader" />
                </div>
              ) : noticiasVisiveis.length === 0 ? (
                <div className="surface-card flex flex-col items-center gap-4 p-10 text-center shadow-xl">
                  <svg className="h-12 w-12 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        className="surface-card flex h-full flex-col overflow-hidden border border-border-color/60 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-44">
                          {noticia.imagem_url ? (
                            <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-muted-bg">
                              <svg className="h-10 w-10 text-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M9 5V3m0 2h6m0 0V3m-6 6h6v4H9V9z" />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-3 p-5">
                          <h3 className="text-lg font-semibold text-foreground line-clamp-2">{noticia.titulo}</h3>
                          <p className="text-sm text-foreground/70 line-clamp-3">{noticia.resumo}</p>
                          <div className="mt-auto flex items-center justify-between text-xs text-foreground/60">
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
                        disabled={isLoading}
                        className="btn btn-outline px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isLoading ? (
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

      <Footer />
    </div>
  );
}
