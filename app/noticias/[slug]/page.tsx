import { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { getNewsBySlug } from '@/lib/news';
import OperatingHoursIndicator from '../../components/OperatingHoursIndicator';
import Link from 'next/link';
import { notFound } from 'next/navigation';

// Função para gerar metadados dinâmicos
export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const news = await getNewsBySlug(params.slug);
  
  if (!news) {
    return {
      title: 'Notícia não encontrada - Foco no ENEM',
    };
  }
  
  return {
    title: `${news.title} - Foco no ENEM`,
    description: news.description,
  };
}

// Componente de página usando as tipagens corretas do Next.js
export default async function NewsDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const news = await getNewsBySlug(params.slug);
  
  // Se a notícia não for encontrada, redireciona para 404
  if (!news) {
    notFound();
  }
  
  // Formatar a data de publicação
  const publishDate = new Date(news.published_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link 
            href="/noticias" 
            className="text-primary hover:underline flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para todas as notícias
          </Link>
        </div>
        
        <article className="card border border-border-color p-6 md:p-8 mb-8">
          <header className="mb-6">
            <div className="mb-4">
              <span className="inline-block bg-primary-light text-primary-dark text-xs font-semibold px-3 py-1 rounded-full">
                {news.category}
              </span>
              <time className="text-sm text-gray-500 dark:text-gray-400 ml-3" dateTime={news.published_at}>
                {publishDate}
              </time>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4">
              {news.title}
            </h1>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6">
              {news.description}
            </p>
            {news.image_url && (
              <div className="mb-6 rounded-lg overflow-hidden border border-border-color">
                <img 
                  src={news.image_url} 
                  alt={news.title} 
                  className="w-full object-cover h-auto md:h-80"
                />
              </div>
            )}
          </header>
          
          <div className="prose dark:prose-invert max-w-none">
            {news.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-4">{paragraph}</p>
            ))}
          </div>
          
          {news.source && (
            <div className="mt-8 pt-4 border-t border-border-color">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <strong>Fonte:</strong> {news.source}
              </p>
            </div>
          )}
          
          {news.tags && news.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {news.tags.map(tag => (
                <Link 
                  key={tag} 
                  href={`/noticias?tag=${tag}`}
                  className="text-xs bg-muted-bg hover:bg-primary-light text-foreground hover:text-primary-dark px-3 py-1 rounded-full transition-colors"
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
        </article>
        
        {news.related_posts && news.related_posts.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-primary">
              Notícias Relacionadas
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Aqui você pode adicionar cards para posts relacionados */}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
