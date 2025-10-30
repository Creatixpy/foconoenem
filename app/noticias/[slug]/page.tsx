"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { Noticia } from "@/types";
import { getNoticiaPorSlug, getNoticiasPorTag } from "@/lib/supabase";
import NewsImage from "@/app/components/NewsImage";

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
        
        const resultado = await getNoticiaPorSlug(slug);
        
        if (!resultado) {
          setError("Notícia não encontrada");
          return;
        }
        
        setNoticia(resultado);
        
        // Carregar notícias relacionadas usando a primeira tag
        if (resultado.tags && resultado.tags.length > 0) {
          const relacionadas = await getNoticiasPorTag(resultado.tags[0], 3);
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
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8 flex justify-center items-center">
          <div className="loader"></div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (error || !noticia) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow container mx-auto p-4 md:p-8">
          <div className="card p-8 text-center">
            <svg className="w-16 h-16 mx-auto text-danger mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-2xl font-bold mb-4">{error || "Notícia não encontrada"}</h2>
            <Link href="/noticias" className="btn btn-primary mt-4">
              Voltar para notícias
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/noticias" className="text-primary hover:underline flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para notícias
          </Link>
        </div>
        
        <article className="card p-6 md:p-8 border border-border-color">
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
            
            {/* Tags */}
            {noticia.tags && noticia.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {noticia.tags.map((tag, index) => (
                  <Link
                    key={index}
                    href={`/noticias?tag=${tag}`}
                    className="badge badge-primary"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
            
            {/* Resumo */}
            <div className="bg-muted-bg p-4 rounded-lg border border-border-color">
              <p className="italic">{noticia.resumo}</p>
            </div>
          </header>
          
          {/* Conteúdo da notícia */}
          <div 
            className="prose dark:prose-invert max-w-none" 
            dangerouslySetInnerHTML={renderizarConteudo(noticia.conteudo)}
          />
          
          {/* Rodapé do artigo */}
          <footer className="mt-10 pt-6 border-t border-border-color">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Publicado em {formatarData(noticia.data_publicacao)} por {noticia.autor}
            </p>
            
            {/* Compartilhamento */}
            <div className="mt-4">
              <p className="text-sm mb-2">Compartilhe:</p>
              <div className="flex space-x-3">
                <button 
                  className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  aria-label="Compartilhar no Facebook"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z" />
                  </svg>
                </button>
                <button 
                  className="p-2 bg-blue-400 text-white rounded-full hover:bg-blue-500 transition"
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(noticia.titulo)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  aria-label="Compartilhar no Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </button>
                <button 
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                  onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(noticia.titulo + ' - ' + window.location.href)}`, '_blank')}
                  aria-label="Compartilhar no WhatsApp"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                  </svg>
                </button>
              </div>
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
                  className="card border border-border-color overflow-hidden hover:shadow-lg transition-all"
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
      </main>
      
      <Footer />
    </div>
  );
}
