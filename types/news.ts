export interface News {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  image_url: string;
  published_at: string;
  author: string;
  category: string;
  featured: boolean;
  created_at: string;
}

export interface NewsPreview {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  published_at: string;
  category: string;
  featured: boolean;
}
