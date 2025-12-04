/**
 * SEO Constants
 * Centralized SEO metadata for the application
 */

export const SEO = {
    SITE_NAME: 'Foco no ENEM',
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? 'https://foconoenem.vercel.app',

    DEFAULT_TITLE: 'Foco no ENEM - Plataforma de Simulados e Redações',
    TITLE_TEMPLATE: '%s | Foco no ENEM',

    DEFAULT_DESCRIPTION:
        'Simule redações e questões do ENEM com feedback por IA, dashboards personalizados e notícias atualizadas.',

    LOCALE: 'pt_BR',
    TWITTER_HANDLE: '@foconoenem',

    IMAGES: {
        DEFAULT: '/foconoenemicon.png',
        WIDTH: 512,
        HEIGHT: 512,
        ALT: 'Foco no ENEM',
    },
} as const;

export const THEME_COLORS = {
    LIGHT: '#ffffff',
    DARK: '#0a0a0f',
} as const;
