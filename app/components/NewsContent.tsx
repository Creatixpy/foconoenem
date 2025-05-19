import Image from 'next/image';
import { News } from '@/types/news';

interface NewsContentProps {
  news: News;
}

export default function NewsContent({ news }: NewsContentProps) {
  const formattedDate = new Date(news.published_at).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <article className="max-w-4xl mx-auto">
      <div className="mb-6">
        <span className="badge badge-primary text-xs px-3 py-1 rounded-full">
          {news.category}
        </span>
        <h1 className="text-3xl md:text-4xl font-bold mt-4 mb-4">{news.title}</h1>
        <div className="flex items-center text-gray-600 dark:text-gray-300 text-sm mb-6">
          <span className="mr-4">Por {news.author}</span>
          <span>{formattedDate}</span>
        </div>
      </div>

      <div className="relative w-full h-96 mb-8">
        <Image 
          src={news.image_url || '/placeholder-news.jpg'} 
          alt={news.title}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
          priority
        />
      </div>

      <div className="prose prose-lg max-w-none dark:prose-invert mb-8">
        <div dangerouslySetInnerHTML={{ __html: news.content }} />
      </div>

      <div className="mt-12 pt-6 border-t border-border-color">
        <div className="flex items-center">
          <div className="text-sm text-gray-600 dark:text-gray-300">
            Compartilhar:
          </div>
          <div className="flex ml-4 space-x-2">
            <button aria-label="Compartilhar no Facebook" className="p-2 rounded-full bg-muted-bg hover:bg-primary hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.19795 21.5H13.198V13.4901H16.8021L17.198 9.50977H13.198V7.5C13.198 6.94772 13.6457 6.5 14.198 6.5H17.198V2.5H14.198C11.4365 2.5 9.19795 4.73858 9.19795 7.5V9.50977H7.19795L6.80206 13.4901H9.19795V21.5Z"></path>
              </svg>
            </button>
            <button aria-label="Compartilhar no Twitter" className="p-2 rounded-full bg-muted-bg hover:bg-primary hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 5.89c-.7.31-1.45.52-2.25.62.81-.48 1.43-1.25 1.72-2.16-.76.45-1.6.78-2.5.95-.72-.76-1.74-1.24-2.87-1.24-2.17 0-3.94 1.76-3.94 3.94 0 .31.04.61.1.9-3.27-.16-6.18-1.73-8.12-4.11-.34.58-.53 1.25-.53 1.97 0 1.37.7 2.57 1.76 3.28-.65-.02-1.26-.2-1.79-.5v.05c0 1.91 1.36 3.5 3.16 3.87-.33.09-.68.14-1.04.14-.25 0-.5-.02-.74-.07.5 1.57 1.96 2.71 3.68 2.74-1.35 1.06-3.04 1.68-4.89 1.68-.32 0-.63-.02-.94-.05 1.74 1.12 3.8 1.77 6.02 1.77 7.22 0 11.17-5.98 11.17-11.17 0-.17 0-.34-.01-.51.77-.55 1.43-1.24 1.96-2.03z"></path>
              </svg>
            </button>
            <button aria-label="Compartilhar por WhatsApp" className="p-2 rounded-full bg-muted-bg hover:bg-primary hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.18 2.095 3.195 5.076 4.485.709.315 1.262.48 1.694.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
