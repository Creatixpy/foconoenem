import Image from 'next/image';
import Link from 'next/link';
import { NewsPreview } from '@/types/news';

interface NewsCardProps {
  news: NewsPreview;
  featured?: boolean;
}

export default function NewsCard({ news, featured = false }: NewsCardProps) {
  const formattedDate = new Date(news.published_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className={`card overflow-hidden ${featured ? 'border-primary' : 'border-border-color'} border transition-transform hover:-translate-y-1`}>
      <Link href={`/noticias/${news.slug}`} className="block">
        <div className="relative w-full h-52">
          <Image 
            src={news.image_url || '/placeholder-news.jpg'} 
            alt={news.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute top-3 left-3">
            <span className="badge badge-primary text-xs px-2 py-1 rounded-full">
              {news.category}
            </span>
          </div>
        </div>
        <div className="p-4">
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            {formattedDate}
          </div>
          <h3 className="text-lg font-semibold mb-2 line-clamp-2">{news.title}</h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">{news.description}</p>
          
          <div className="mt-4 text-primary font-medium text-sm flex items-center">
            Ler mais
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </div>
        </div>
      </Link>
    </div>
  );
}
