"use client";

import { useState, useEffect } from 'react';
import { NewsPreview } from '@/types/news';
import { getFeaturedNews } from '@/lib/news';
import NewsCard from './NewsCard';

export default function FeaturedNews() {
  const [news, setNews] = useState<NewsPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeaturedNews() {
      try {
        setLoading(true);
        const featuredNews = await getFeaturedNews(3);
        setNews(featuredNews);
      } catch (error) {
        console.error("Erro ao carregar notícias em destaque:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedNews();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse mt-8">
        <div className="bg-muted-bg h-12 w-64 mb-6 rounded"></div>
        <div className="grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card border border-border-color h-96">
              <div className="bg-muted-bg h-52 w-full"></div>
              <div className="p-4">
                <div className="bg-muted-bg h-4 w-24 mb-4 rounded"></div>
                <div className="bg-muted-bg h-6 w-full mb-4 rounded"></div>
                <div className="bg-muted-bg h-20 w-full rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (news.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 animate-fadeIn">
      <h2 className="text-2xl font-bold mb-6 text-primary flex items-center">
        <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        Notícias em Destaque
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {news.map((item) => (
          <NewsCard key={item.id} news={item} featured={true} />
        ))}
      </div>
    </section>
  );
}
