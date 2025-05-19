"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { getCategories } from '@/lib/news';

export default function CategoryFilter() {
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('categoria');

  useEffect(() => {
    async function fetchCategories() {
      try {
        setLoading(true);
        const categoriesList = await getCategories();
        setCategories(categoriesList);
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchCategories();
  }, []);

  const handleCategoryClick = (category: string | null) => {
    const params = new URLSearchParams(searchParams);
    
    if (category) {
      params.set('categoria', category);
    } else {
      params.delete('categoria');
    }
    
    router.push(`${pathname}?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse flex space-x-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-muted-bg h-8 w-24 rounded-full flex-shrink-0"></div>
        ))}
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <button 
        onClick={() => handleCategoryClick(null)}
        className={`px-4 py-1 rounded-full text-sm font-medium ${!currentCategory ? 'bg-primary text-white' : 'bg-muted-bg text-foreground'}`}
      >
        Todas
      </button>
      
      {categories.map((category) => (
        <button 
          key={category}
          onClick={() => handleCategoryClick(category)}
          className={`px-4 py-1 rounded-full text-sm font-medium ${currentCategory === category ? 'bg-primary text-white' : 'bg-muted-bg text-foreground'}`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
