'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import AuthProviders from '@/app/auth-providers';
import { useAuth } from '@/lib/auth/context';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface ImportResult {
  imported: number;
  skipped: number;
  totalConsulta: number;
}

interface ModerateResult {
  reviewed: number;
  approved: number;
  rejected: number;
  highlightsRefreshed?: boolean;
}

interface StatusResult {
  ultimaAtualizacao: string | null;
  proxima: string | null;
  status: 'never' | 'pending' | 'updated';
}

interface NoticiaRow {
  id: string;
  titulo: string;
  slug: string;
  data_publicacao: string;
  destaque: boolean;
  tags: string[];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function AdminNoticiasPageContent() {
  const router = useRouter();
  const { user, loading: authLoading, initialized } = useAuth();
  const [authorized, setAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  // Data
  const [noticias, setNoticias] = useState<NoticiaRow[]>([]);
  const [noticiasLoading, setNoticiasLoading] = useState(true);
  const [statusData, setStatusData] = useState<StatusResult | null>(null);

  // Actions
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [moderating, setModerating] = useState(false);
  const [moderateResult, setModerateResult] = useState<ModerateResult | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.replace('/login');
    }
  }, [initialized, authLoading, user, router]);

  // Check admin authorization
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch('/api/noticias/admin/status');
        if (res.ok) {
          const data = await res.json();
          setAuthorized(data.authorized === true);
        }
      } catch { /* ignore */ }
      setAuthChecking(false);
    })();
  }, [user]);

  // Fetch news list
  const fetchNoticias = useCallback(async () => {
    setNoticiasLoading(true);
    try {
      const res = await fetch('/api/noticias?limit=50&offset=0');
      if (res.ok) {
        const data = await res.json();
        setNoticias(data.noticias ?? []);
      }
    } catch { /* ignore */ }
    setNoticiasLoading(false);
  }, []);

  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/noticias/destaques/status');
      if (res.ok) {
        setStatusData(await res.json());
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (authorized) {
      fetchNoticias();
      fetchStatus();
    }
  }, [authorized, fetchNoticias, fetchStatus]);

  // Import handler
  const handleImport = async () => {
    setImporting(true);
    setImportResult(null);
    setActionError(null);
    try {
      const res = await fetch('/api/noticias/importar', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }
      setImportResult(await res.json());
      fetchNoticias();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao importar');
    }
    setImporting(false);
  };

  // Moderate handler
  const handleModerate = async () => {
    setModerating(true);
    setModerateResult(null);
    setActionError(null);
    try {
      const res = await fetch('/api/noticias/admin/moderar', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }
      setModerateResult(await res.json());
      fetchNoticias();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao moderar');
    }
    setModerating(false);
  };

  // Loading / auth states
  if (authLoading || !initialized || authChecking) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-[var(--bg-surface)]" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-[var(--bg-surface)]" />
          ))}
        </div>
        <div className="h-96 rounded-xl bg-[var(--bg-surface)]" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-[var(--danger)]/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-[var(--danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-[var(--text-primary)] mb-2">Acesso restrito</h2>
        <p className="text-sm text-[var(--text-muted)]">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch { return d; }
  };

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* header */}
        <motion.div
          className="mb-8 space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
            <span className="text-[var(--warning)]">⚡</span>
            Admin
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Gerenciar Notícias</h1>
        </motion.div>

        {/* stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Total de notícias</p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">{noticias.length}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Destaques</p>
            <p className="text-2xl font-bold text-[var(--primary)]">
              {noticias.filter((n) => n.destaque).length}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
            <p className="text-xs text-[var(--text-muted)] mb-1">Status atualização</p>
            <p className="text-sm font-medium">
              {statusData ? (
                <span className={
                  statusData.status === 'updated' ? 'text-[var(--success)]' :
                  statusData.status === 'pending' ? 'text-[var(--warning)]' :
                  'text-[var(--text-muted)]'
                }>
                  {statusData.status === 'updated' ? '✓ Atualizado' :
                   statusData.status === 'pending' ? '⏳ Pendente' :
                   'Nunca atualizado'}
                </span>
              ) : (
                <span className="text-[var(--text-muted)]">—</span>
              )}
            </p>
          </div>
        </div>

        {/* action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <button
            onClick={handleImport}
            disabled={importing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {importing ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
            )}
            {importing ? 'Importando...' : 'Importar da NewsAPI'}
          </button>

          <button
            onClick={handleModerate}
            disabled={moderating}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--border-color)] text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {moderating ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
              </svg>
            )}
            {moderating ? 'Moderando...' : 'Moderar com IA'}
          </button>
        </div>

        {/* action results */}
        {actionError && (
          <div className="mb-6 rounded-xl border border-[var(--danger)]/20 bg-[var(--danger)]/5 p-4 text-sm text-[var(--danger)]">
            {actionError}
          </div>
        )}
        {importResult && (
          <div className="mb-6 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-4 text-sm text-[var(--success)]">
            Importação concluída: {importResult.imported} importadas, {importResult.skipped} ignoradas de {importResult.totalConsulta} consultadas.
          </div>
        )}
        {moderateResult && (
          <div className="mb-6 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/5 p-4 text-sm text-[var(--success)]">
            Moderação concluída: {moderateResult.reviewed} revisadas, {moderateResult.approved} aprovadas, {moderateResult.rejected} rejeitadas.
            {moderateResult.highlightsRefreshed ? ' Destaques recalculados automaticamente.' : ''}
          </div>
        )}

        {/* news table */}
        <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[var(--border-color)] flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text-primary)]">Artigos ({noticias.length})</h2>
            <button
              onClick={fetchNoticias}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
            >
              Atualizar lista
            </button>
          </div>

          {noticiasLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 rounded bg-[var(--bg-surface)] animate-pulse" />
              ))}
            </div>
          ) : noticias.length === 0 ? (
            <div className="p-8 text-center text-sm text-[var(--text-muted)]">
              Nenhuma notícia encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-color)] text-left">
                    <th className="px-4 py-2.5 font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider">Título</th>
                    <th className="px-4 py-2.5 font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider hidden sm:table-cell">Tags</th>
                    <th className="px-4 py-2.5 font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider hidden md:table-cell">Data</th>
                    <th className="px-4 py-2.5 font-medium text-xs text-[var(--text-muted)] uppercase tracking-wider text-center">Destaque</th>
                  </tr>
                </thead>
                <tbody>
                  {noticias.map((n) => (
                    <tr key={n.id} className="border-b border-[var(--border-color)] last:border-b-0 hover:bg-[var(--bg-surface)] transition-colors">
                      <td className="px-4 py-3">
                        <a
                          href={`/noticias/${n.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors line-clamp-1 max-w-xs block"
                        >
                          {n.titulo}
                        </a>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {n.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-muted)]">
                              {tag}
                            </span>
                          ))}
                          {n.tags.length > 2 && (
                            <span className="text-[10px] text-[var(--text-muted)]">+{n.tags.length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--text-muted)] hidden md:table-cell whitespace-nowrap">
                        {formatDate(n.data_publicacao)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {n.destaque ? (
                          <span className="text-[var(--warning)]">★</span>
                        ) : (
                          <span className="text-[var(--text-muted)] opacity-30">☆</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminNoticiasPage() {
  return (
    <AuthProviders>
      <AdminNoticiasPageContent />
    </AuthProviders>
  );
}
