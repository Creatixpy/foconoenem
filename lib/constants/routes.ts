/**
 * Application Routes
 * Centralized route definitions for consistent navigation
 */

export const ROUTES = {
    // Main pages
    HOME: '/',
    ABOUT: '/sobre',

    // Features
    ESSAY: '/redacao',
    QUESTIONS: '/questoes',
    NEWS: '/noticias',
    COMMUNITY: '/comunidade',
    RESULTS: '/resultados',

    // User
    ACCOUNT: '/conta',
    DONATION: '/doacao',

    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    FORGOT_PASSWORD: '/auth/forgot-password',

    // Legal
    PRIVACY: '/privacidade',
    TERMS: '/termos',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Route = typeof ROUTES[RouteKey];
