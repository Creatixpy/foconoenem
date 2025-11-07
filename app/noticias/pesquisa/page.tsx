"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Noticia } from "@/types";
import { getNoticiasPorPesquisa } from "@/lib/supabase";

// Componente separado para usar useSearchParams dentro do Suspense
function PesquisaContent() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const termo = searchParams?.get("q") || "";

  // Formatar data para padrão brasileiro
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Realizar a pesquisa quando o termo mudar
  useEffect(() => {
    const realizarPesquisa = async () => {
      if (!termo) {
        setNoticias([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const resultado = await getNoticiasPorPesquisa(termo);
        setNoticias(resultado);

      } catch (erro) {
        console.error("Erro ao pesquisar notícias:", erro);
        setError("Não foi possível realizar a pesquisa. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };

    realizarPesquisa();
  }, [termo]);

  // Manipular nova pesquisa
  const [novaPesquisa, setNovaPesquisa] = useState(termo);

  const handlePesquisar = (e: React.FormEvent) => {
    e.preventDefault();

    if (novaPesquisa.trim()) {
      router.push(`/noticias/pesquisa?q=${encodeURIComponent(novaPesquisa.trim())}`);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href="/noticias" className="text-primary hover:underline flex items-center gap-1 text-sm font-semibold">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </Link>
        <span className="text-xs uppercase tracking-[0.2em] text-foreground/60">Busca enxuta</span>
      </div>

      <h1 className="text-3xl font-bold mb-4">Pesquise em segundos</h1>

      <form onSubmit={handlePesquisar} className="mb-6">
        <div className="flex">
          <input
            type="text"
            value={novaPesquisa}
            onChange={(e) => setNovaPesquisa(e.target.value)}
            placeholder="Buscar notícias..."
            className="flex-grow p-3 rounded-l-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            aria-label="Buscar notícias"
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary-dark text-white p-3 rounded-r-lg transition-colors"
            aria-label="Pesquisar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </form>

      {termo && (
        <p className="mb-4 text-sm text-foreground/70">
          {isLoading ? "Buscando..." : `${noticias.length} resultado(s) para “${termo}”`}
        </p>
      )}

      {error && (
        <div className="bg-danger-light text-danger p-4 rounded-lg mb-8 animate-fadeIn">
          <p>{error}</p>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="loader"></div>
        </div>
      ) : noticias.length === 0 ? (
        <div className="text-center py-12 card border border-border-color">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
          </svg>
          <p className="text-gray-500 mb-3 text-sm">Nada apareceu para “{termo}”. Tente outro termo curto.</p>
          <Link href="/noticias" className="btn btn-glass inline-flex text-sm">
            Ver todas
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {noticias.map((noticia) => (
            <Link
              key={noticia.id}
              href={`/noticias/${noticia.slug}`}
              className="card border border-border-color overflow-hidden hover:shadow-lg transition-all"
            >
              <div className="h-40 relative">
                {noticia.imagem_url ? (
                  <Image
                    src={noticia.imagem_url}
                    alt={noticia.titulo}
                    fill
                    className="object-cover"
                  />
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
      )}
    </>
  );
}

export default function PesquisaPage() {
  return (
    <main className="flex-grow">
      <div className="container mx-auto p-4 md:p-8">
        <Suspense fallback={<div className="loader my-12" />}>
          <PesquisaContent />
        </Suspense>
      </div>
    </main>
  );
}
