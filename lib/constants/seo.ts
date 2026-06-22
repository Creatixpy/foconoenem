/**
 * SEO Constants
 * Centralized SEO metadata for the application
 */

export const SEO = {
    SITE_NAME: 'AprovIA',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aproviaedu.vercel.app',

    DEFAULT_TITLE: 'AprovIA - Sua aprovação, potencializada por IA',
    TITLE_TEMPLATE: '%s | AprovIA',

    DEFAULT_DESCRIPTION:
        'Redações, questões e evolução para o ENEM com inteligência artificial e feedback personalizado.',

    LOCALE: 'pt_BR',
    IMAGES: {
        DEFAULT: '/favicon.svg',
        WIDTH: 48,
        HEIGHT: 48,
        ALT: 'AprovIA',
    },
} as const;

export const THEME_COLORS = {
    DARK: '#080A0F',
} as const;
