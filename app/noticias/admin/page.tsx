"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Noticia } from "@/types";
import { useAuth } from "@/app/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import NewsImage from "@/app/components/NewsImage";

type DestaquesUpdateResult = {
  status?: "success" | "error" | "skipped";
  message?: string;
  destaques?: string[];
  error?: string;
};

type DestaquesStatus = {
  ultimaAtualizacao: string | null;
  proxima: string | null;
  status: string;
};

type ImportSummary = {
  imported: number;
  skipped: number;
  totalConsulta: number;
  details?: {
    mode?: string;
  };
};

type ModerationSummary = {
  reviewed: number;
  removed: number;
  kept: number;
  removedIds?: string[];
};

export default function AdminDestaques() {
  const { user, loading: authLoading } = useAuth();

  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DestaquesUpdateResult | null>(null);
  const [statusDestaques, setStatusDestaques] = useState<DestaquesStatus | null>(null);
  const [noticiasDestaque, setNoticiasDestaque] = useState<Noticia[]>([]);
  const [loadingDestaques, setLoadingDestaques] = useState(false);
  const [removeLoading, setRemoveLoading] = useState<Record<string, boolean>>({});
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<ImportSummary | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [moderationResult, setModerationResult] = useState<ModerationSummary | null>(null);
  const [moderationError, setModerationError] = useState<string | null>(null);

  const carregarStatus = useCallback(async () => {
    if (!accessToken) return;
    try {
      const response = await fetch("/api/noticias/destaques/status", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error ?? "Falha ao consultar status dos destaques.");
      }

      setStatusDestaques(payload);
    } catch (error) {
      console.error("Erro ao carregar status de destaques:", error);
    }
  }, [accessToken]);

  const carregarNoticiasDestaque = useCallback(async () => {
    try {
      setLoadingDestaques(true);
      const destaques = await fetchNoticiasDestaque(10);
      setNoticiasDestaque(destaques);
    } catch (error) {
      console.error("Erro ao carregar notícias em destaque:", error);
    } finally {
      setLoadingDestaques(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const validarAcesso = async () => {
      if (authLoading) {
        return;
      }

      if (!user) {
        if (!cancelled) {
          setAccessToken(null);
          setAuthorized(false);
          setAuthError("Faça login para acessar esta área administrativa.");
          setCheckingAccess(false);
        }
        return;
      }

      setCheckingAccess(true);
      setAuthError(null);

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (cancelled) {
          setCheckingAccess(false);
          return;
        }

        const token = sessionData?.session?.access_token;
        if (!token) {
          setAccessToken(null);
          setAuthorized(false);
          setAuthError("Sessão expirada. Faça login novamente.");
          setCheckingAccess(false);
          return;
        }

        setAccessToken(token);

        const response = await fetch("/api/noticias/admin/status", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok || !payload?.authorized) {
          setAuthorized(false);
          setAuthError(payload?.error ?? "Você não tem permissão para acessar esta área.");
          return;
        }

        setAuthorized(true);
        setAuthError(null);
      } catch (error) {
        console.error("Erro ao validar acesso administrativo:", error);
        if (!cancelled) {
          setAuthorized(false);
          setAuthError("Não foi possível validar suas permissões agora. Tente novamente em instantes.");
        }
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    };

    void validarAcesso();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (!authorized) {
      return;
    }

    void carregarStatus();
    void carregarNoticiasDestaque();
  }, [authorized, carregarNoticiasDestaque, carregarStatus]);

  const formatarData = (dataString: string | null) => {
    if (!dataString) return "Não disponível";

    const data = new Date(dataString);
    return data.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAtualizarDestaques = useCallback(async () => {
    if (!authorized) {
      return;
    }

    try {
      setIsLoading(true);
      setResult(null);

      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await fetch("/api/atualizarDestaques", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.error ?? data?.message ?? "Falha ao atualizar destaques.";

        if (response.status === 401 || response.status === 403) {
          setAuthorized(false);
          setAuthError(errorMessage);
        }

        throw new Error(errorMessage);
      }

      setResult(data);
      await carregarStatus();
      await carregarNoticiasDestaque();
    } catch (error) {
      console.error("Erro ao atualizar destaques:", error);
      setResult({
        status: "error",
        message:
          error instanceof Error ? error.message : "Falha ao processar a solicitação de atualização.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, authorized, carregarNoticiasDestaque, carregarStatus]);

  const handleImportarNoticias = useCallback(async () => {
    if (!authorized) {
      return;
    }

    try {
      setImportLoading(true);
      setImportError(null);
      setImportResult(null);

      if (!accessToken) {
        throw new Error("Sessão expirada. Faça login novamente.");
      }

      const response = await fetch("/api/noticias/importar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.error ?? data?.message ?? "Não foi possível importar notícias agora.";

        if (response.status === 401 || response.status === 403) {
          setAuthorized(false);
          setAuthError(errorMessage);
        }

        throw new Error(errorMessage);
      }

      setImportResult(data as ImportSummary);
      await carregarNoticiasDestaque();
    } catch (error) {
      console.error("Erro ao importar notícias:", error);
      setImportError(
        error instanceof Error ? error.message : "Falha ao importar notícias. Tente novamente mais tarde."
      );
    } finally {
      setImportLoading(false);
    }
  }, [accessToken, authorized, carregarNoticiasDestaque]);

  const handleRemoverDestaque = useCallback(
    async (id: string) => {
      if (!authorized) {
        return;
      }

      try {
        setRemoveLoading((prev) => ({ ...prev, [id]: true }));

        if (!accessToken) {
          throw new Error("Sessão expirada. Faça login novamente.");
        }

        const response = await fetch("/api/destaques/remover", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ id }),
        });

        const data = await response.json().catch(() => null);
        if (!response.ok) {
          const errorMessage = data?.error ?? data?.message ?? "Falha ao remover destaque.";

          if (response.status === 401 || response.status === 403) {
            setAuthorized(false);
            setAuthError(errorMessage);
          }

          throw new Error(errorMessage);
        }

        setNoticiasDestaque((prev) => prev.filter((noticia) => noticia.id !== id));
      } catch (error) {
        console.error("Erro ao remover destaque:", error);
        setAuthError(
          error instanceof Error ? error.message : "Não foi possível remover o destaque. Tente novamente."
        );
      } finally {
        setRemoveLoading((prev) => ({ ...prev, [id]: false }));
      }
    },
    [accessToken, authorized]
  );

  const handleLimparNoticiasIrrelevantes = useCallback(async () => {
    if (!authorized) {
      return;
    }

    if (!accessToken) {
      setModerationError("Sessão expirada. Faça login novamente.");
      return;
    }

    try {
      setModerationLoading(true);
      setModerationError(null);
      setModerationResult(null);

      const response = await fetch("/api/noticias/admin/moderar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage = data?.error ?? data?.message ?? "Falha ao remover notícias irrelevantes.";

        if (response.status === 401 || response.status === 403) {
          setAuthorized(false);
          setAuthError(errorMessage);
        }

        throw new Error(errorMessage);
      }

      setModerationResult(data as ModerationSummary);
      await carregarNoticiasDestaque();
    } catch (error) {
      console.error("Erro ao executar limpeza de notícias:", error);
      setModerationError(
        error instanceof Error ? error.message : "Não foi possível limpar notícias irrelevantes agora."
      );
    } finally {
      setModerationLoading(false);
    }
  }, [accessToken, authorized, carregarNoticiasDestaque]);

  return (
    <main className="flex-grow">
      <div className="container mx-auto p-4 md:p-8">
        <div className="mb-6">
          <Link href="/noticias" className="text-primary hover:underline flex items-center">
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar para notícias
          </Link>
        </div>

        <div className="card p-6 md:p-8 border border-border-color">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6 flex items-center">
            <svg className="w-7 h-7 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            Administração de Destaques
          </h1>

          {authLoading || checkingAccess ? (
            <div className="bg-muted-bg p-6 rounded-lg flex flex-col items-center justify-center gap-3">
              <div className="loader" />
              <p className="text-sm text-foreground/70">Verificando suas permissões...</p>
            </div>
          ) : !user ? (
            <div className="bg-muted-bg p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Acesso restrito</h2>
              <p className="text-sm text-foreground/80">
                Faça login com uma conta autorizada para gerenciar os destaques de notícias.
              </p>
            </div>
          ) : !authorized ? (
            <div className="bg-muted-bg p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4">Permissão necessária</h2>
              <p className="text-sm text-foreground/80">
                {authError ?? "Você não tem permissão para acessar esta área administrativa."}
              </p>
            </div>
          ) : (
            <>
              <div className="bg-muted-bg p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Status Atual dos Destaques</h2>
                <div className="space-y-2">
                  <p>
                    <strong>Última Atualização:</strong>{" "}
                    {statusDestaques?.ultimaAtualizacao
                      ? formatarData(statusDestaques.ultimaAtualizacao)
                      : "Nunca atualizado"}
                  </p>
                  <p>
                    <strong>Próxima Atualização Automática:</strong>{" "}
                    {statusDestaques?.proxima ? formatarData(statusDestaques.proxima) : "Não definido"}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span
                      className={`
                        ${statusDestaques?.status === "updated" ? "text-success" : ""}
                        ${statusDestaques?.status === "pending" ? "text-warning" : ""}
                        ${
                          statusDestaques?.status === "error" || statusDestaques?.status === "never"
                            ? "text-danger"
                            : ""
                        }
                      `}
                    >
                      {statusDestaques?.status === "updated" && "Atualizado"}
                      {statusDestaques?.status === "pending" && "Atualização Pendente"}
                      {statusDestaques?.status === "error" && "Erro na Atualização"}
                      {statusDestaques?.status === "never" && "Nunca Atualizado"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                  Notícias em Destaque ({noticiasDestaque.length}/5)
                </h2>

                {loadingDestaques ? (
                  <div className="flex justify-center my-8">
                    <div className="loader"></div>
                  </div>
                ) : noticiasDestaque.length === 0 ? (
                  <div className="text-center py-8 bg-muted-bg rounded-lg">
                    <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <p className="text-gray-500">Nenhuma notícia em destaque no momento</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {noticiasDestaque.map((noticia) => (
                      <div
                        key={noticia.id}
                        className="card flex flex-col md:flex-row overflow-hidden border border-border-color hover:shadow-md transition-all"
                      >
                        <div className="h-48 md:h-auto md:w-48 relative flex-shrink-0">
                          {noticia.imagem_url ? (
                            <NewsImage src={noticia.imagem_url} alt={noticia.titulo} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full bg-primary-light flex items-center justify-center">
                              <svg
                                className="w-12 h-12 text-primary opacity-30"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1}
                                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <div className="p-4 flex-grow flex flex-col">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-lg mb-2">{noticia.titulo}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                                {noticia.resumo}
                              </p>
                              <p className="text-xs text-gray-500">
                                Publicado em {formatarData(noticia.data_publicacao)}
                              </p>
                              {noticia.tags && noticia.tags.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {noticia.tags.map((tag) => (
                                    <span key={tag} className="badge badge-outline">
                                      #{tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="mt-4 flex justify-between items-center gap-3">
                            <Link href={`/noticias/${noticia.slug}`} className="text-primary hover:underline text-sm flex items-center gap-1">
                              <span>Ver notícia</span>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                              </svg>
                            </Link>
                            <button
                              onClick={() => void handleRemoverDestaque(noticia.id)}
                              disabled={Boolean(removeLoading[noticia.id])}
                              className="btn btn-outline text-danger border-danger flex items-center gap-2"
                            >
                              {removeLoading[noticia.id] ? (
                                <span className="loader loader--sm" aria-hidden />
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 7V5a2 2 0 012-2h2a2 2 0 012 2v2m4 0H5" />
                                </svg>
                              )}
                              Remover destaque
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-muted-bg p-6 rounded-lg mb-6">
                <h2 className="text-xl font-semibold mb-4">Importar notícias da NewsAPI</h2>
                <p className="text-sm text-foreground/70 mb-4">
                  Sincronize rapidamente as últimas pautas sobre educação, ENEM e vestibulares. Essa ação busca a
                  NewsAPI e salva apenas as notícias inéditas na base.
                </p>

                <button
                  onClick={() => void handleImportarNoticias()}
                  disabled={importLoading}
                  className="btn btn-outline flex items-center gap-2"
                >
                  {importLoading ? (
                    <>
                      <span className="loader loader--sm" aria-hidden />
                      Importando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M9 17v-2a4 4 0 014-4h8m0 0l-3-3m3 3l-3 3"
                        />
                      </svg>
                      Importar notícias agora
                    </>
                  )}
                </button>

                {importError && (
                  <div className="mt-4 border border-danger text-danger rounded-lg p-4 text-sm">
                    {importError}
                  </div>
                )}

                {importResult && (
                  <div className="mt-4 border border-success text-success rounded-lg p-4 text-sm space-y-1">
                    <p>
                      {importResult.imported} notícia(s) adicionada(s) ao banco.{" "}
                      {importResult.skipped > 0
                        ? `Itens ignorados por já existirem: ${importResult.skipped}.`
                        : "Nenhum item foi ignorado."}
                    </p>
                    <p className="text-xs text-foreground/70">
                      Resultado da consulta: {importResult.totalConsulta} artigos · origem:{" "}
                      {importResult.details?.mode === "cron" ? "tarefa agendada" : "ação manual"}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-muted-bg p-6 rounded-lg">
                <h2 className="text-xl font-semibold mb-4">Atualização manual</h2>
                <p className="text-sm text-foreground/70 mb-4">
                  Acione uma nova seleção automática de destaques. Essa ação utiliza IA para avaliar as notícias
                  recentes e marcar até cinco itens relevantes.
                </p>

                <button
                  onClick={() => void handleAtualizarDestaques()}
                  disabled={isLoading}
                  className="btn btn-primary flex items-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <span className="loader loader--sm" aria-hidden />
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.8}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Atualizar Destaques Agora
                    </>
                  )}
                </button>

                {result && (
                  <div className="mt-4">
                    <div
                      className={`
                        border rounded-lg p-4 text-sm
                        ${result.status === "success" ? "border-success text-success" : ""}
                        ${result.status === "error" ? "border-danger text-danger" : ""}
                        ${result.status === "skipped" ? "border-warning text-warning" : ""}
                      `}
                    >
                      {result.message}
                      {result.destaques && result.destaques.length > 0 && (
                        <p className="mt-2 text-foreground">
                          IDs selecionados:{" "}
                          <span className="font-mono text-xs">{result.destaques.join(", ")}</span>
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-muted-bg p-6 rounded-lg space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Limpeza automática com IA</h2>
                  <p className="text-sm text-foreground/70 mt-1">
                    Analisa as últimas notícias cadastradas e remove automaticamente aquelas que fogem de educação,
                    ENEM, vestibulares ou políticas educacionais.
                  </p>
                </div>

                <button
                  onClick={() => void handleLimparNoticiasIrrelevantes()}
                  disabled={moderationLoading}
                  className="btn btn-outline flex items-center gap-2"
                >
                  {moderationLoading ? (
                    <>
                      <span className="loader loader--sm" aria-hidden />
                      Limpando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.6}
                          d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h9a2 2 0 002-2v-5m-7 0l9-9h3v3l-9 9H8v-3z"
                        />
                      </svg>
                      Remover notícias irrelevantes
                    </>
                  )}
                </button>

                {moderationError && (
                  <div className="border border-danger text-danger rounded-lg p-4 text-sm">{moderationError}</div>
                )}

                {moderationResult && (
                  <div className="border border-success text-success rounded-lg p-4 text-sm space-y-1">
                    <p>
                      Revisadas: {moderationResult.reviewed} · Removidas: {moderationResult.removed} · Mantidas:{" "}
                      {moderationResult.kept}
                    </p>
                    {moderationResult.removedIds && moderationResult.removedIds.length > 0 && (
                      <p className="text-xs text-foreground/70">
                        IDs removidos:{" "}
                        <span className="font-mono">
                          {moderationResult.removedIds.join(", ")}
                        </span>
                      </p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </main>
  );
}

async function fetchNoticiasDestaque(limit: number): Promise<Noticia[]> {
  const params = new URLSearchParams({
    limit: limit.toString(),
    destaque: "true",
  });

  const response = await fetch(`/api/noticias?${params.toString()}`, {
    cache: "no-store",
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error ?? "Falha ao buscar destaques.");
  }

  return (payload?.noticias as Noticia[] | undefined) ?? [];
}
