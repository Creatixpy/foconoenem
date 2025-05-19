"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Noticia } from "@/types";
import { getNoticias, getNoticiasDestaque } from "@/lib/supabase";

export default function NoticiasPage() {
  const [noticias, setNoticias] = useState<Noticia[]>([]);
  const [noticiasDestaque, setNoticiasDestaque] = useState<Noticia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTag, setFiltroTag] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [temMaisNoticias, setTemMaisNoticias] = useState(true);
  const limitePorPagina = 6;

  // Carregar notícias
  useEffect(() => {
    const carregarNoticias = async () => {
      try {
        setIsLoading(true);
        
        // Carregar destaques apenas na primeira página
        if (pagina === 1) {
          const destaques = await getNoticiasDestaque();
          setNoticiasDestaque(destaques);
        }
        
        // Carregar notícias normais
        const offset = (pagina - 1) * limitePorPagina;
        const resultado = await getNoticias(limitePorPagina, offset);
        
        if (pagina === 1) {
          setNoticias(resultado);
        } else {
          setNoticias(prev => [...prev, ...resultado]);
        }
        
        // Verificar se tem mais notícias para carregar
        setTemMaisNoticias(resultado.length === limitePorPagina);
        
      } catch (erro) {
        console.error("Erro ao carregar notícias:", erro);
        setError("Não foi possível carregar as notícias. Tente novamente mais tarde.");
      } finally {
        setIsLoading(false);
      }
    };
    
    carregarNoticias();
  }, [pagina]);

  // Formatar data para padrão brasileiro
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Carregar mais notícias
  const carregarMais = () => {
    setPagina(prev => prev + 1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-8 h-8 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Notícias do ENEM
          </h1>
          
          <div className="mb-8">
            <div className="relative">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar notícias..."
                className="w-full p-4 pl-12 pr-4 rounded-lg border border-border-color focus:outline-none focus:ring-2 focus:ring-primary transition-all"
              />
              <svg
                className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>
          
          {error && (
            <div className="bg-danger-light text-danger p-4 rounded-lg mb-8 animate-fadeIn">
              <p>{error}</p>
            </div>
          )}
          
          {/* Seção de Destaques - Carrossel */}
          {noticiasDestaque.length > 0 && !error && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
                Destaques
              </h2>
              
              <div className="grid md:grid-cols-3 gap-6">
                {noticiasDestaque.map((noticia) => (
                  <Link
                    key={noticia.id}
                    href={`/noticias/${noticia.slug}`}
                    className="card border border-border-color overflow-hidden hover:shadow-lg transition-all"
                  >
                    <div className="h-48 relative">
                      {noticia.imagem_url ? (
                        <Image
                          src={noticia.imagem_url}
                          alt={noticia.titulo}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-light flex items-center justify-center">
                          <svg className="w-16 h-16 text-primary opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                          </svg>
                        </div>
                      )}
                      <div className="absolute top-2 left-2">
                        <span className="badge badge-primary">Destaque</span>
                      </div>
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
            </div>
          )}
          
          {/* Lista de Notícias */}
          <div>
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              Últimas Notícias
            </h2>
            
            {isLoading && pagina === 1 ? (
              <div className="flex justify-center my-12">
                <div className="loader"></div>
              </div>
            ) : noticias.length === 0 ? (
              <div className="text-center py-12">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
                </svg>
                <p className="text-gray-500">Nenhuma notícia encontrada</p>
              </div>
            ) : (
              <>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
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
                
                {temMaisNoticias && (
                  <div className="flex justify-center mt-8">
                    <button
                      onClick={carregarMais}
                      disabled={isLoading}
                      className="btn btn-outline flex items-center"
                    >
                      {isLoading ? (
                        <>
                          <span className="inline-block w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                          Carregando...
                        </>
                      ) : (
                        <>
                          Carregar mais
                          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
