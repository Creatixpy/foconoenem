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
    RESULTS: '/resultados',

    // User
    ACCOUNT: '/conta',
    DONATION: '/doacao',

    // Auth
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',

    // Legal
    PRIVACY: '/privacidade',
    TERMS: '/termos',
} as const;

export type RouteKey = keyof typeof ROUTES;
export type Route = typeof ROUTES[RouteKey];
