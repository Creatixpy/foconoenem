"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Noticia } from "@/types";
import { NewsImage } from "@/app/components/shared";

export default function NoticiaDetalhePage() {
  const [noticia, setNoticia] = useState<Noticia | null>(null);
  const [noticiasRelacionadas, setNoticiasRelacionadas] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useParams();
  const slug = params?.slug as string;

  // Carregar a notícia
  useEffect(() => {
    const carregarNoticia = async () => {
      if (!slug) return;

      try {
        setIsLoading(true);
        setError(null);

        const resultado = await fetchNoticiaPorSlug(slug);

        if (!resultado) {
          setError("Notícia não encontrada");
          return;
        }

        setNoticia(resultado);

        // Carregar notícias relacionadas usando a primeira tag
        if (resultado.tags && resultado.tags.length > 0) {
          const relacionadas = await fetchNoticiasPorTag(resultado.tags[0], 3);
          // Filtrar para não incluir a notícia atual
          setNoticiasRelacionadas(
            relacionadas.filter(item => item.id !== resultado.id)
          );
        }

      } catch (erro) {
        console.error("Erro ao carregar notícia:", erro);
        setError("Não foi possível carregar a notícia. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    carregarNoticia();
  }, [slug]);

  // Formatar data para padrão brasileiro
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Renderizar conteúdo da notícia - suporte básico para formatação em HTML
  const renderizarConteudo = (conteudo: string) => {
    return { __html: conteudo };
  };

  if (isLoading) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-12">
        <div className="loader" />
      </main>
    );
  }

  if (error || !noticia) {
    return (
      <main className="flex-grow">
        <div className="container mx-auto max-w-3xl p-4 md:p-8">
          <div className="card p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4">{error || "Notícia não encontrada"}</h2>
            <Link href="/noticias" className="btn btn-primary mt-4">
              Voltar para notícias
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-grow">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/noticias" className="text-primary hover:underline flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para notícias
          </Link>
        </div>

        <article className="card p-6 md:p-8 border-0">
          {/* Cabeçalho da notícia */}
          <header className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">{noticia.titulo}</h1>

            <div className="flex flex-wrap justify-between items-center text-sm text-gray-600 dark:text-gray-300 mb-6">
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatarData(noticia.data_publicacao)}</span>
              </div>

              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Por {noticia.autor}</span>
              </div>
            </div>

            {/* Imagem principal */}
            {noticia.imagem_url && (
              <div className="relative w-full h-[300px] md:h-[400px] rounded-lg overflow-hidden mb-6">
                <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
              </div>
            )}

            {noticia.tags && noticia.tags.length > 0 && (
              <div className="mb-4 flex flex-wrap gap-2">
                {noticia.tags.map((tag) => (
                  <Link key={tag} href={`/noticias?tag=${tag}`} className="badge badge-primary text-xs">
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {noticia.resumo && (
              <details className="rounded-2xl border-0 bg-muted-bg/60 p-4 text-sm text-foreground/80">
                <summary className="cursor-pointer font-semibold text-foreground">Ver resumo rápido</summary>
                <p className="mt-3 leading-relaxed">{noticia.resumo}</p>
              </details>
            )}
          </header>

          {/* Conteúdo da notícia */}
          <div
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={renderizarConteudo(noticia.conteudo)}
          />

          {noticia.fonte_url && (
            <div className="mt-8 rounded-lg border-0 bg-muted-bg p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-foreground/75">Fonte original</p>
              <a
                href={noticia.fonte_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-primary underline underline-offset-4 break-all"
              >
                {noticia.fonte_url}
              </a>
            </div>
          )}

          {/* Rodapé do artigo */}
          <footer className="mt-10 pt-6 border-t border-border-color">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Publicado em {formatarData(noticia.data_publicacao)} por {noticia.autor}
            </p>

            {/* Compartilhamento */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-foreground/70">
              <span className="uppercase tracking-[0.2em] text-foreground/75">Compartilhar</span>
              <button
                className="btn btn-glass px-3 py-1"
                onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, "_blank")}
              >
                Facebook
              </button>
              <button
                className="btn btn-glass px-3 py-1"
                onClick={() =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(noticia.titulo)}&url=${encodeURIComponent(window.location.href)}`,
                    "_blank"
                  )
                }
              >
                Twitter
              </button>
              <button
                className="btn btn-glass px-3 py-1"
                onClick={() =>
                  window.open(
                    `https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + " - " + window.location.href)}`,
                    "_blank"
                  )
                }
              >
                WhatsApp
              </button>
            </div>
          </footer>
        </article>

        {/* Notícias relacionadas */}
        {noticiasRelacionadas.length > 0 && (
          <section className="mt-12">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Notícias Relacionadas
            </h2>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {noticiasRelacionadas.map((noticia) => (
                <Link
                  key={noticia.id}
                  href={`/noticias/${noticia.slug}`}
                  className="card border-0 overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="h-40 relative">
                    {noticia.imagem_url ? (
                      <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-muted-bg flex items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{noticia.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                      {noticia.resumo}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>{formatarData(noticia.data_publicacao)}</span>
                      <span>Por {noticia.autor}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

async function fetchNoticiaPorSlug(slug: string): Promise<Noticia | null> {
  const response = await fetch(`/api/noticias/${slug}`, { cache: "no-store" });
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Notícia não encontrada.");
  }

  return (payload?.noticia as Noticia | undefined) ?? null;
}

async function fetchNoticiasPorTag(tag: string, limit: number): Promise<Noticia[]> {
  const params = new URLSearchParams({
    tag,
    limit: limit.toString(),
  });

  const response = await fetch(`/api/noticias?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(payload?.error ?? "Falha ao carregar notícias relacionadas.");
  }

  return (payload?.noticias as Noticia[] | undefined) ?? [];
}
