/**
 * Interface para a prévia de uma notícia (listagem)
 */
export interface NewsPreview {
  id: string;
  title: string;
  slug: string;
  description: string;
  image_url?: string;
  published_at: string;
  category: string;
  featured: boolean;
}

/**
 * Interface para os dados completos de uma notícia
 */
export interface News extends NewsPreview {
  content: string;
  author?: string;
  source?: string;
  tags?: string[];
  related_posts?: string[];
}
