import type { Metadata } from 'next';
import { CANONICAL_SITE_ORIGIN } from '@/lib/constants/site';

type PageMetadataOptions = {
  title: string;
  description: string;
  pathname?: string;
  noIndex?: boolean;
  article?: boolean;
  image?: { url: string; alt: string };
};

export function createPageMetadata({
  title, description, pathname, noIndex = false, article = false, image,
}: PageMetadataOptions): Metadata {
  const pageTitle = `${title} | AprovIA`;
  const canonical = pathname ? new URL(pathname, CANONICAL_SITE_ORIGIN).href : undefined;
  const socialImage = image ?? { url: `${CANONICAL_SITE_ORIGIN}/favicon.svg`, alt: 'AprovIA' };

  return {
    title: { absolute: pageTitle },
    description,
    alternates: canonical ? { canonical } : undefined,
    robots: { index: !noIndex, follow: !noIndex },
    openGraph: {
      title: pageTitle,
      description,
      url: canonical,
      siteName: 'AprovIA',
      locale: 'pt_BR',
      type: article ? 'article' : 'website',
      images: [socialImage],
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: pageTitle,
      description,
      images: [socialImage.url],
    },
  };
}
