"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  getUserStatistics,
  recalculateUserStatistics,
} from "@/lib/auth/service";
import type { UserStatistics } from "@/lib/auth/types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { getBrowserClient, withTimeout } from "@/lib/db";
import { isAbortError } from "@/lib/errors";

export default function ContaPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [essays, setEssays] = useState<Array<{nota: number; created_at: string; id: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const statsRequestRef = useRef<Promise<UserStatistics | null> | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      statsRequestRef.current = null;
    };
  }, []);

  const fetchLatestStatistics = useCallback(async () => {
    if (!userId) return null;
    if (statsRequestRef.current) {
      return statsRequestRef.current;
    }

    const request = getUserStatistics(userId)
      .then((stats) => {
        setStatistics(stats);
        setErrorMessage(null);
        return stats;
      })
      .catch((error) => {
        if (isAbortError(error)) {
          setErrorMessage("Conexão instável. Tentaremos novamente em instantes.");
        }
        throw error;
      })
      .finally(() => {
        statsRequestRef.current = null;
      });
    statsRequestRef.current = request;
    return request;
  }, [userId]);

  const scheduleStatisticsRetry = useCallback(() => {
    if (retryTimeoutRef.current || statsRequestRef.current) {
      return;
    }

    retryTimeoutRef.current = setTimeout(() => {
      retryTimeoutRef.current = null;
      void fetchLatestStatistics().catch((error) => {
        if (isAbortError(error)) {
          scheduleStatisticsRetry();
        } else {
          console.error('Erro ao atualizar estatísticas após nova tentativa:', error);
          setErrorMessage('Não foi possível atualizar suas estatísticas em tempo real.');
        }
      });
    }, 5000);
  }, [fetchLatestStatistics, setErrorMessage]);

  const triggerStatisticsRefresh = useCallback(() => {
    void fetchLatestStatistics().catch((error) => {
      console.error('Erro ao atualizar estatísticas:', error);
      if (isAbortError(error)) {
        scheduleStatisticsRetry();
      } else {
        setErrorMessage('Não foi possível atualizar suas estatísticas em tempo real.');
      }
    });
  }, [fetchLatestStatistics, scheduleStatisticsRetry, setErrorMessage]);

  // Store the refresh function in a ref to avoid subscription recreation
  const triggerRefreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    triggerRefreshRef.current = triggerStatisticsRefresh;
  }, [triggerStatisticsRefresh]);

  // Initial data load - only once per userId
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      hasLoadedRef.current = null;
      return;
    }

    // Skip if already loaded for this userId
    if (hasLoadedRef.current === userId) {
      return;
    }

    const loadData = async () => {
      hasLoadedRef.current = userId;
      setLoading(true);
      setErrorMessage(null);

      try {
        await fetchLatestStatistics();

        const supabase = getBrowserClient();
        const essaysResponse = await withTimeout(
          async (signal) =>
            await supabase
              .from('essay_results')
              .select('id, nota, created_at')
              .eq('user_id', userId)
              .order('created_at', { ascending: false })
              .limit(10)
              .abortSignal(signal),
          'default'
        );

        const { data: essaysData, error: essaysError } = essaysResponse;

        if (essaysError) {
          throw essaysError;
        }

        setEssays(essaysData || []);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        if (isAbortError(error)) {
          setErrorMessage('Conexão instável. Tentaremos novamente em instantes.');
          scheduleStatisticsRetry();
        } else {
          setErrorMessage('Não foi possível carregar seus dados agora. Tente novamente em instantes.');
        }
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]); // Callbacks excluded - using refs to prevent infinite loops

  // Realtime subscription - use refs for callbacks to prevent recreation
  useEffect(() => {
    if (!userId) return;

    const supabase = getBrowserClient();
    const channel = supabase
      .channel(`account-updates-${userId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_statistics', filter: `user_id=eq.${userId}` },
        () => {
          triggerRefreshRef.current();
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'essay_results', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newEssay = payload.new as { id: string; nota: number; created_at: string };
          setEssays((previous) => {
            const filtered = previous.filter((essay) => essay.id !== newEssay.id);
            return [{ id: newEssay.id, nota: newEssay.nota, created_at: newEssay.created_at }, ...filtered].slice(0, 10);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'essay_results', filter: `user_id=eq.${userId}` },
        (payload) => {
          const updatedEssay = payload.new as { id: string; nota: number; created_at: string };
          setEssays((previous) => {
            const filtered = previous.filter((essay) => essay.id !== updatedEssay.id);
            return [{ id: updatedEssay.id, nota: updatedEssay.nota, created_at: updatedEssay.created_at }, ...filtered].slice(0, 10);
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'essay_results', filter: `user_id=eq.${userId}` },
        (payload) => {
          const removedEssay = payload.old as { id: string };
          setEssays((previous) => previous.filter((essay) => essay.id !== removedEssay.id));
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'quiz_results', filter: `user_id=eq.${userId}` },
        () => {
          triggerRefreshRef.current();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]); // Only depend on userId - use refs for callbacks

  // Visibility and focus handlers - use ref for callback
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        triggerRefreshRef.current();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);
    window.addEventListener('online', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('online', handleVisibility);
    };
  }, []); // No dependencies - uses ref

  const handleRecalculate = async () => {
    if (!userId) return;

    setRecalculating(true);
    setErrorMessage(null);
    try {
      await recalculateUserStatistics(userId);
      // Recarregar estatísticas
      await fetchLatestStatistics();
    } catch (error) {
      console.error('Erro ao recalcular:', error);
      setErrorMessage('Não foi possível atualizar suas estatísticas agora. Tente novamente.');
    } finally {
      setRecalculating(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent('/conta')}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || loading || !user || !profile) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="loader" />
      </main>
    );
  }

  // Preparar dados para gráficos
  const competenciasData = statistics ? [
    { competencia: 'C1', nota: statistics.media_competencia1 || 0 },
    { competencia: 'C2', nota: statistics.media_competencia2 || 0 },
    { competencia: 'C3', nota: statistics.media_competencia3 || 0 },
    { competencia: 'C4', nota: statistics.media_competencia4 || 0 },
    { competencia: 'C5', nota: statistics.media_competencia5 || 0 },
  ] : [];

  const disciplinasData = statistics ? [
    { 
      disciplina: 'Matemática', 
      acertos: statistics.acertos_matematica, 
      total: statistics.total_matematica,
      taxa: statistics.total_matematica > 0 ? (statistics.acertos_matematica / statistics.total_matematica * 100) : 0
    },
    { 
      disciplina: 'Português', 
      acertos: statistics.acertos_portugues, 
      total: statistics.total_portugues,
      taxa: statistics.total_portugues > 0 ? (statistics.acertos_portugues / statistics.total_portugues * 100) : 0
    },
    { 
      disciplina: 'Química', 
      acertos: statistics.acertos_quimica, 
      total: statistics.total_quimica,
      taxa: statistics.total_quimica > 0 ? (statistics.acertos_quimica / statistics.total_quimica * 100) : 0
    },
    { 
      disciplina: 'Física', 
      acertos: statistics.acertos_fisica, 
      total: statistics.total_fisica,
      taxa: statistics.total_fisica > 0 ? (statistics.acertos_fisica / statistics.total_fisica * 100) : 0
    },
    { 
      disciplina: 'Geografia', 
      acertos: statistics.acertos_geografia, 
      total: statistics.total_geografia,
      taxa: statistics.total_geografia > 0 ? (statistics.acertos_geografia / statistics.total_geografia * 100) : 0
    },
  ] : [];

  const evolucaoRedacoes = essays.map((essay, index) => ({
    numero: essays.length - index,
    nota: essay.nota,
    data: new Date(essay.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })).reverse();

  // Análise e recomendações
  const analises: string[] = [];
  const recomendacoes: string[] = [];

  if (statistics) {
    // Análise de redação
    if (statistics.total_redacoes > 0) {
      if (statistics.media_nota_redacao && statistics.media_nota_redacao >= 800) {
        analises.push("🎉 Excelente desempenho em redação! Continue praticando.");
      } else if (statistics.media_nota_redacao && statistics.media_nota_redacao >= 600) {
        analises.push("📈 Bom desempenho em redação. Foco nas competências mais fracas pode elevar sua nota.");
      } else {
        analises.push("⚠️ Sua nota em redação está abaixo da média. Mais prática é fundamental.");
        recomendacoes.push("Pratique pelo menos 2 redações por semana");
      }

      // Análise por competência
      const competencias = [
        { num: 1, media: statistics.media_competencia1, nome: "Norma Padrão" },
        { num: 2, media: statistics.media_competencia2, nome: "Compreensão do Tema" },
        { num: 3, media: statistics.media_competencia3, nome: "Argumentação" },
        { num: 4, media: statistics.media_competencia4, nome: "Coesão" },
        { num: 5, media: statistics.media_competencia5, nome: "Proposta de Intervenção" },
      ];

      const maisFragil = competencias.reduce((prev, curr) => 
        (curr.media || 0) < (prev.media || 0) ? curr : prev
      );

      if (maisFragil.media && maisFragil.media < 160) {
        analises.push(`⚠️ Competência ${maisFragil.num} (${maisFragil.nome}) precisa de atenção especial.`);
        recomendacoes.push(`Estude especificamente sobre ${maisFragil.nome} da redação ENEM`);
      }
    }

    // Análise de questões
    if (statistics.total_questoes_respondidas > 0) {
      if (statistics.taxa_acerto && statistics.taxa_acerto >= 70) {
        analises.push("🎯 Ótimo desempenho nas questões objetivas!");
      } else if (statistics.taxa_acerto && statistics.taxa_acerto >= 50) {
        analises.push("📊 Desempenho médio nas questões. Continue estudando!");
      } else {
        analises.push("⚠️ Taxa de acerto abaixo do esperado. Revise os conteúdos básicos.");
      }

      // Análise por disciplina
      const disciplinasAbaixo = disciplinasData.filter(d => d.total > 0 && d.taxa < 50);
      if (disciplinasAbaixo.length > 0) {
        analises.push(`📚 Disciplinas que precisam de mais estudo: ${disciplinasAbaixo.map(d => d.disciplina).join(', ')}`);
        disciplinasAbaixo.forEach(d => {
          recomendacoes.push(`Dedique mais tempo estudando ${d.disciplina}`);
        });
      }
    }

    // Recomendações gerais
    if (statistics.total_redacoes < 5) {
      recomendacoes.push("Faça mais redações para ter dados estatísticos mais precisos");
    }
    if (statistics.total_simulados < 3) {
      recomendacoes.push("Faça mais simulados de questões para avaliar seu conhecimento");
    }
  }

  return (
    <main className="flex-grow">
      <div className="container mx-auto max-w-7xl p-4 md:p-8">
        {/* Header da Conta */}
        <div className="mb-8 rounded-2xl border-0 bg-card-bg p-6 shadow-sm animate-fadeIn md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-2xl font-bold text-primary">
                {profile.nome_completo?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                  {profile.nome_completo || 'Estudante'}
                </h1>
                <p className="text-foreground/60">{user.email}</p>
                {profile.objetivo && (
                  <p className="text-sm text-primary mt-1">🎯 {profile.objetivo}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="btn btn-outline flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {recalculating ? 'Atualizando...' : 'Atualizar'}
              </button>
              <Link href="/conta/editar" className="btn btn-primary">
                Editar Perfil
              </Link>
            </div>
        </div>
      </div>

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-danger/20 bg-danger-light/30 p-4 text-sm text-danger shadow-sm">
            {errorMessage}
          </div>
        )}

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 animate-stagger">
          <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60">Redações Feitas</span>
              <svg className="w-8 h-8 text-primary/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-foreground">{statistics?.total_redacoes || 0}</p>
            {statistics?.media_nota_redacao && (
              <p className="text-sm text-success mt-1">
                Média: {statistics.media_nota_redacao.toFixed(0)} pontos
              </p>
            )}
          </div>

          <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60">Simulados Feitos</span>
              <svg className="w-8 h-8 text-accent/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-foreground">{statistics?.total_simulados || 0}</p>
            {statistics?.total_questoes_respondidas && statistics.total_questoes_respondidas > 0 && (
              <p className="text-sm text-accent mt-1">
                {statistics.total_questoes_respondidas} questões respondidas
              </p>
            )}
          </div>

          <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60">Taxa de Acerto</span>
              <svg className="w-8 h-8 text-success/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statistics?.taxa_acerto ? `${statistics.taxa_acerto.toFixed(1)}%` : '-'}
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              {statistics?.total_acertos || 0} acertos de {statistics?.total_questoes_respondidas || 0}
            </p>
          </div>

          <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-foreground/60">Melhor Redação</span>
              <svg className="w-8 h-8 text-warning/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {statistics?.melhor_nota_redacao || '-'}
            </p>
            <p className="text-sm text-foreground/60 mt-1">
              {statistics?.pior_nota_redacao ? `Pior: ${statistics.pior_nota_redacao}` : 'Faça uma redação'}
            </p>
          </div>
        </div>

        {/* Análises e Recomendações */}
        {(analises.length > 0 || recomendacoes.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {analises.length > 0 && (
              <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  Análise do seu Desempenho
                </h2>
                <div className="flex flex-wrap gap-2">
                  {analises.map((analise, index) => (
                    <span
                      key={`${analise}-${index}`}
                      className="rounded-full bg-muted-bg/50 border-0 px-3 py-2 text-xs text-foreground/60"
                    >
                      {analise}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {recomendacoes.length > 0 && (
              <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-2 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Recomendações de Estudo
                </h2>
                <div className="flex flex-wrap gap-2">
                  {recomendacoes.map((rec, index) => (
                    <span
                      key={`${rec}-${index}`}
                      className="rounded-full bg-primary/10 px-3 py-2 text-xs text-foreground/60"
                    >
                      {rec}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gráficos */}
        {statistics && statistics.total_redacoes > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Gráfico de Competências */}
            <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-4">
                Desempenho por Competência
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={competenciasData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="competencia" />
                  <PolarRadiusAxis domain={[0, 200]} />
                  <Radar 
                    name="Nota Média" 
                    dataKey="nota" 
                    stroke="#2563eb" 
                    fill="#2563eb" 
                    fillOpacity={0.6} 
                  />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
              <p className="text-sm text-foreground/60 text-center mt-2">
                Escala de 0 a 200 pontos por competência
              </p>
            </div>

            {/* Gráfico de Evolução */}
            {evolucaoRedacoes.length > 1 && (
              <div className="rounded-2xl border-0 bg-card-bg p-6 shadow-sm">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Evolução das Notas
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={evolucaoRedacoes}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis domain={[0, 1000]} />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="nota" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      name="Nota"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-sm text-foreground/60 text-center mt-2">
                  Últimas {evolucaoRedacoes.length} redações
                </p>
              </div>
            )}
          </div>
        )}

        {/* Gráficos de Questões */}
        {statistics && statistics.total_questoes_respondidas > 0 && (
          <div className="rounded-2xl border-0 bg-card-bg p-6 mb-8 shadow-sm">
            <h2 className="text-xl font-bold text-foreground mb-4">
              Desempenho por Disciplina
            </h2>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={disciplinasData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="disciplina" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="acertos" fill="#10b981" name="Acertos" />
                <Bar dataKey="total" fill="#e2e8f0" name="Total" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Mensagem se não houver dados */}
        {statistics && statistics.total_redacoes === 0 && statistics.total_simulados === 0 && (
          <div className="rounded-2xl border-0 bg-card-bg p-12 text-center shadow-sm">
            <svg className="w-20 h-20 mx-auto mb-4 text-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Comece sua Jornada de Estudos!
            </h2>
            <p className="text-foreground/60 mb-6 max-w-2xl mx-auto">
              Você ainda não fez nenhuma redação ou simulado. Comece agora para acompanhar seu progresso e receber análises personalizadas!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/redacao" className="btn btn-primary">
                Fazer Redação
              </Link>
              <Link href="/questoes" className="btn btn-outline">
                Fazer Simulado
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
