const WORKSPACE_PATHS = ['/redacao', '/questoes', '/conta', '/resultados', '/noticias/admin'];

export function isWorkspacePath(pathname: string) {
  return WORKSPACE_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export type AccountTab = 'overview' | 'essays' | 'questions';

export function accountTabFromQuery(value: string | null): AccountTab {
  if (value === 'redacoes') return 'essays';
  if (value === 'questoes') return 'questions';
  return 'overview';
}

export function accountTabHref(query: string, tab: AccountTab) {
  const params = new URLSearchParams(query);
  if (tab === 'overview') params.delete('aba');
  else params.set('aba', tab === 'essays' ? 'redacoes' : 'questoes');
  const search = params.toString();
  return `/conta${search ? `?${search}` : ''}`;
}

const SESSION_PATHS = ['/login', '/register', '/forgot-password', '/reset-password', '/auth', '/planos', '/doacao'];

export function isLegacySessionPath(pathname: string) {
  return isWorkspacePath(pathname) || SESSION_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}
