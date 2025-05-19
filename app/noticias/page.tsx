import Header from '../components/Header';
import Footer from '../components/Footer';
import CategoryFilter from '../components/CategoryFilter';
import NewsCard from '../components/NewsCard';
import FeaturedNews from '../components/FeaturedNews';
import { getAllNews, getNewsByCategory } from '@/lib/news';
import { NewsPreview } from '@/types/news';
import OperatingHoursIndicator from '../components/OperatingHoursIndicator';

interface NewsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function NewsPage({ searchParams }: NewsPageProps) {
  const categoria = searchParams.categoria as string | undefined;
  
  // Buscar notícias com base na categoria selecionada ou todas
  const news = categoria 
    ? await getNewsByCategory(categoria) 
    : await getAllNews();
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <OperatingHoursIndicator />
      
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <section className="mb-8">
          <h1 className="text-3xl font-bold mb-4 text-primary flex items-center">
            <svg className="w-8 h-8 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Notícias do ENEM
          </h1>
          <p className="text-lg mb-6">
            Acompanhe as últimas notícias sobre o ENEM, vestibulares e dicas de estudo para se preparar melhor.
          </p>
        </section>
        
        {!categoria && <FeaturedNews />}
        
        <section className="mt-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-primary">
              {categoria ? `Notícias: ${categoria}` : 'Todas as Notícias'}
            </h2>
          </div>
          
          <CategoryFilter />
          
          {news.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-semibold mb-2">Nenhuma notícia encontrada</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Não encontramos notícias para esta categoria. Tente selecionar outra categoria.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {news.map((item: NewsPreview) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          )}
        </section>
      </main>
      
      <Footer />
    </div>
  );
}
