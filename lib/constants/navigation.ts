import { ROUTES } from './routes';

/**
 * Navigation Links
 * Shared navigation configuration used across Header, Footer, etc
 */

export interface NavLink {
    href: string;
    label: string;
}

export const NAV_LINKS: NavLink[] = [
    { href: ROUTES.HOME, label: 'Início' },
    { href: ROUTES.ESSAY, label: 'Redação' },
    { href: ROUTES.QUESTIONS, label: 'Questões' },
    { href: ROUTES.NEWS, label: 'Notícias' },
    { href: ROUTES.COMMUNITY, label: 'Comunidade' },
    { href: ROUTES.ABOUT, label: 'Sobre' },
];

export const FOOTER_LINKS: NavLink[] = [
    { href: ROUTES.ABOUT, label: 'Sobre' },
    { href: ROUTES.PRIVACY, label: 'Privacidade' },
    { href: ROUTES.TERMS, label: 'Termos' },
    { href: ROUTES.DONATION, label: 'Doação' },
];
