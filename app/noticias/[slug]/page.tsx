import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import NewsContent from '../../components/NewsContent';
import { getNewsBySlug, getFeaturedNews } from '@/lib/news';
import NewsCard from '../../components/NewsCard';
import OperatingHoursIndicator from '../../components/OperatingHoursIndicator';

interface NewsDetailPageProps {
  params: {
    slug: string;
  };
}

export default async function NewsDetailPage({ params }: NewsDetailPageProps) {
  const { slug } = params;
  const news = await getNewsBySlug(slug);
  
  // Buscar notícias relacionadas (usando as destacadas por simplicidade)
  const relatedNews = await getFeaturedNews(3);
  
  // Se a notícia não for encontrada
  if (!news) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <OperatingHoursIndicator />
        
        <main className="flex-grow container mx-auto p-4 md:p-8 flex items-center justify-center">
          <div className="card p-8 max-w-md w-full text-center">
            <svg className="w-20 h-20 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h1 className="text-2xl font-bold mb-4">Notícia não encontrada</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              A notícia que você está procurando não existe ou foi removida.
            </p>
            <Link 
              href="/noticias" 
              className="btn btn-primary"
            >
              Voltar para Notícias
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
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link 
            href="/noticias" 
            className="text-primary flex items-center hover:underline"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para Notícias
          </Link>
        </div>
        
        <NewsContent news={news} />
        
        {relatedNews.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6 text-primary">Notícias Relacionadas</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedNews
                .filter(item => item.slug !== slug)
                .slice(0, 3)
                .map(item => (
                  <NewsCard key={item.id} news={item} />
                ))}
            </div>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
