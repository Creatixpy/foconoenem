"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";
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
  ResponsiveContainer
} from "recharts";

type TabType = 'visao-geral' | 'redacoes' | 'questoes';

interface EssayData {
  nota: number;
  created_at: string;
  id: string;
}

interface AccountData {
  statistics: UserStatistics | null;
  essays: EssayData[];
}

// Fetch account data via API route (more reliable than direct Supabase calls)
async function fetchAccountData(signal?: AbortSignal): Promise<AccountData> {
  const response = await fetch('/api/conta/dados', {
    signal,
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`API respondeu ${response.status}`);
  }

  return response.json();
}

export default function ContaPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [essays, setEssays] = useState<EssayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visao-geral');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent('/conta')}`);
    }
  }, [authLoading, user, router]);

  // Load data when authenticated
  const loadData = useCallback(async () => {
    if (!user) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      setLoading(true);
      setErrorMessage(null);

      const data = await fetchAccountData(controller.signal);
      setStatistics(data.statistics);
      setEssays(data.essays);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setErrorMessage('Conexão lenta. Tente atualizar a página.');
      } else {
        console.error('Erro ao carregar dados:', error);
        setErrorMessage('Não foi possível carregar seus dados. Tente novamente.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && !authLoading) {
      void loadData();
    }
  }, [user, authLoading, loadData]);

  // Recalculate statistics
  const handleRecalculate = async () => {
    if (!user) return;

    setRecalculating(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/conta/recalcular', {
        method: 'POST',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error('Erro ao recalcular');
      }

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Erro ao recalcular:', error);
      setErrorMessage('Não foi possível atualizar suas estatísticas.');
    } finally {
      setRecalculating(false);
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="loader" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="text-center space-y-4">
          <div className="loader" />
          <p className="text-sm text-foreground/60">Carregando sua conta...</p>
        </div>
      </main>
    );
  }

  // Prepare chart data
  const competenciasData = statistics ? [
    { competencia: 'C1', nota: statistics.media_competencia1 || 0, fullName: 'Norma Padrão' },
    { competencia: 'C2', nota: statistics.media_competencia2 || 0, fullName: 'Compreensão' },
    { competencia: 'C3', nota: statistics.media_competencia3 || 0, fullName: 'Argumentação' },
    { competencia: 'C4', nota: statistics.media_competencia4 || 0, fullName: 'Coesão' },
    { competencia: 'C5', nota: statistics.media_competencia5 || 0, fullName: 'Intervenção' },
  ] : [];

  const disciplinasData = statistics ? [
    {
      disciplina: 'Mat',
      fullName: 'Matemática',
      acertos: statistics.acertos_matematica,
      total: statistics.total_matematica,
      taxa: statistics.total_matematica > 0 ? (statistics.acertos_matematica / statistics.total_matematica * 100) : 0,
      color: '#3b82f6'
    },
    {
      disciplina: 'Por',
      fullName: 'Português',
      acertos: statistics.acertos_portugues,
      total: statistics.total_portugues,
      taxa: statistics.total_portugues > 0 ? (statistics.acertos_portugues / statistics.total_portugues * 100) : 0,
      color: '#ef4444'
    },
    {
      disciplina: 'Qui',
      fullName: 'Química',
      acertos: statistics.acertos_quimica,
      total: statistics.total_quimica,
      taxa: statistics.total_quimica > 0 ? (statistics.acertos_quimica / statistics.total_quimica * 100) : 0,
      color: '#22c55e'
    },
    {
      disciplina: 'Fis',
      fullName: 'Física',
      acertos: statistics.acertos_fisica,
      total: statistics.total_fisica,
      taxa: statistics.total_fisica > 0 ? (statistics.acertos_fisica / statistics.total_fisica * 100) : 0,
      color: '#a855f7'
    },
    {
      disciplina: 'Geo',
      fullName: 'Geografia',
      acertos: statistics.acertos_geografia,
      total: statistics.total_geografia,
      taxa: statistics.total_geografia > 0 ? (statistics.acertos_geografia / statistics.total_geografia * 100) : 0,
      color: '#f59e0b'
    },
  ] : [];

  const evolucaoRedacoes = essays.map((essay, index) => ({
    numero: essays.length - index,
    nota: essay.nota,
    data: new Date(essay.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })).reverse();

  // Analysis and recommendations
  const analises: string[] = [];
  const recomendacoes: string[] = [];

  if (statistics) {
    if (statistics.total_redacoes > 0) {
      if (statistics.media_nota_redacao && statistics.media_nota_redacao >= 800) {
        analises.push("🎉 Excelente desempenho em redação!");
      } else if (statistics.media_nota_redacao && statistics.media_nota_redacao >= 600) {
        analises.push("📈 Bom desempenho em redação.");
      } else {
        analises.push("⚠️ Redação precisa de mais prática.");
        recomendacoes.push("Pratique 2 redações por semana");
      }

      const competencias = [
        { num: 1, media: statistics.media_competencia1, nome: "Norma Padrão" },
        { num: 2, media: statistics.media_competencia2, nome: "Compreensão" },
        { num: 3, media: statistics.media_competencia3, nome: "Argumentação" },
        { num: 4, media: statistics.media_competencia4, nome: "Coesão" },
        { num: 5, media: statistics.media_competencia5, nome: "Intervenção" },
      ];

      const maisFragil = competencias.reduce((prev, curr) =>
        (curr.media || 0) < (prev.media || 0) ? curr : prev
      );

      if (maisFragil.media && maisFragil.media < 160) {
        recomendacoes.push(`Foco na Competência ${maisFragil.num}`);
      }
    }

    if (statistics.total_questoes_respondidas > 0) {
      if (statistics.taxa_acerto && statistics.taxa_acerto >= 70) {
        analises.push("🎯 Ótimo em questões!");
      } else if (statistics.taxa_acerto && statistics.taxa_acerto >= 50) {
        analises.push("📊 Desempenho médio.");
      } else {
        analises.push("⚠️ Revise os conteúdos.");
      }

      const disciplinasAbaixo = disciplinasData.filter(d => d.total > 0 && d.taxa < 50);
      if (disciplinasAbaixo.length > 0) {
        recomendacoes.push(`Estude: ${disciplinasAbaixo.map(d => d.fullName).join(', ')}`);
      }
    }

    if (statistics.total_redacoes < 5) {
      recomendacoes.push("Faça mais redações");
    }
    if (statistics.total_simulados < 3) {
      recomendacoes.push("Faça mais simulados");
    }
  }

  const tabs = [
    { id: 'visao-geral' as const, label: 'Visão Geral', icon: '📊' },
    { id: 'redacoes' as const, label: 'Redações', icon: '✍️' },
    { id: 'questoes' as const, label: 'Questões', icon: '🎯' },
  ];

  const displayName = profile?.nome_completo?.split(' ')[0] || user.email?.split('@')[0] || 'Estudante';
  const initial = profile?.nome_completo?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'E';

  return (
    <main className="flex-grow bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-6 sm:py-8">
        {/* Header do Perfil */}
        <section className="mb-6 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-4 sm:p-6 shadow-sm animate-fadeIn">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="relative">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-xl sm:text-2xl font-bold text-white shadow-lg">
                  {initial}
                </div>
                <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-success border-2 border-background flex items-center justify-center">
                  <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
              </div>
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
                  {profile?.nome_completo || 'Estudante'}
                </h1>
                <p className="text-sm text-foreground/60 truncate">{user.email}</p>
                {profile?.objetivo && (
                  <p className="text-xs sm:text-sm text-primary mt-0.5 truncate">🎯 {profile.objetivo}</p>
                )}
              </div>
            </div>
            <div className="flex gap-2 self-start sm:self-center">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="btn btn-outline text-sm px-3 py-2 flex items-center gap-1.5"
                aria-label="Atualizar estatísticas"
              >
                <svg className={`w-4 h-4 ${recalculating ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="hidden sm:inline">{recalculating ? 'Atualizando...' : 'Atualizar'}</span>
              </button>
              <Link href="/conta/editar" className="btn btn-primary text-sm px-3 py-2">
                <span className="sm:hidden">Editar</span>
                <span className="hidden sm:inline">Editar Perfil</span>
              </Link>
            </div>
          </div>
        </section>

        {errorMessage && (
          <div className="mb-4 rounded-xl border border-danger/20 bg-danger/10 p-3 text-sm text-danger flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={loadData}
              className="text-xs font-medium underline hover:no-underline"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Tabs de Navegação */}
        <nav className="mb-6 flex gap-1 rounded-xl bg-muted-bg/50 p-1 overflow-x-auto" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`flex-1 min-w-[100px] flex items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${activeTab === tab.id
                  ? 'bg-card-bg text-foreground shadow-sm'
                  : 'text-foreground/60 hover:text-foreground hover:bg-card-bg/50'
                }`}
            >
              <span className="text-base">{tab.icon}</span>
              <span className="hidden xs:inline">{tab.label}</span>
            </button>
          ))}
        </nav>

        {/* Tab: Visão Geral */}
        {activeTab === 'visao-geral' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <StatCard
                icon="📝"
                label="Redações"
                value={statistics?.total_redacoes || 0}
                subtext={statistics?.media_nota_redacao ? `Média: ${statistics.media_nota_redacao.toFixed(0)}` : undefined}
                color="primary"
              />
              <StatCard
                icon="📋"
                label="Simulados"
                value={statistics?.total_simulados || 0}
                subtext={statistics?.total_questoes_respondidas ? `${statistics.total_questoes_respondidas} questões` : undefined}
                color="accent"
              />
              <StatCard
                icon="✅"
                label="Taxa Acerto"
                value={statistics?.taxa_acerto ? `${statistics.taxa_acerto.toFixed(0)}%` : '-'}
                subtext={`${statistics?.total_acertos || 0}/${statistics?.total_questoes_respondidas || 0}`}
                color="success"
              />
              <StatCard
                icon="⭐"
                label="Melhor Nota"
                value={statistics?.melhor_nota_redacao || '-'}
                subtext={statistics?.pior_nota_redacao ? `Pior: ${statistics.pior_nota_redacao}` : undefined}
                color="warning"
              />
            </div>

            {/* Análises e Recomendações */}
            {(analises.length > 0 || recomendacoes.length > 0) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analises.length > 0 && (
                  <div className="rounded-xl bg-card-bg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="text-lg">📊</span> Análise
                    </h3>
                    <div className="space-y-2">
                      {analises.map((a, i) => (
                        <p key={i} className="text-sm text-foreground/70">{a}</p>
                      ))}
                    </div>
                  </div>
                )}
                {recomendacoes.length > 0 && (
                  <div className="rounded-xl bg-card-bg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                      <span className="text-lg">💡</span> Recomendações
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {recomendacoes.map((r, i) => (
                        <span key={i} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{r}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* CTA se não houver dados */}
            {statistics && statistics.total_redacoes === 0 && statistics.total_simulados === 0 && (
              <EmptyState />
            )}
          </div>
        )}

        {/* Tab: Redações */}
        {activeTab === 'redacoes' && (
          <div className="space-y-6 animate-fadeIn">
            {statistics && statistics.total_redacoes > 0 ? (
              <>
                {/* Gráfico de Competências */}
                <div className="rounded-xl bg-card-bg p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground mb-4">Desempenho por Competência</h2>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={competenciasData}>
                        <PolarGrid stroke="var(--border-color)" />
                        <PolarAngleAxis dataKey="competencia" tick={{ fill: 'var(--foreground)', fontSize: 12 }} />
                        <PolarRadiusAxis domain={[0, 200]} tick={{ fontSize: 10 }} />
                        <Radar
                          name="Nota Média"
                          dataKey="nota"
                          stroke="hsl(var(--primary))"
                          fill="hsl(var(--primary))"
                          fillOpacity={0.5}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                          }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs text-foreground/60">
                    {competenciasData.map((c) => (
                      <span key={c.competencia} className="bg-muted-bg/50 px-2 py-1 rounded">
                        {c.competencia}: {c.fullName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Gráfico de Evolução */}
                {evolucaoRedacoes.length > 1 && (
                  <div className="rounded-xl bg-card-bg p-4 sm:p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-foreground mb-4">Evolução das Notas</h2>
                    <div className="h-[200px] sm:h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolucaoRedacoes}>
                          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                          <XAxis dataKey="data" tick={{ fontSize: 11 }} />
                          <YAxis domain={[0, 1000]} tick={{ fontSize: 11 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'var(--card-bg)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px'
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="nota"
                            stroke="hsl(var(--success))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--success))' }}
                            name="Nota"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Lista de Redações */}
                <div className="rounded-xl bg-card-bg p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground mb-4">Histórico de Redações</h2>
                  <div className="space-y-2">
                    {essays.map((essay, index) => (
                      <div
                        key={essay.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted-bg/30 hover:bg-muted-bg/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-foreground/50 w-6">#{essays.length - index}</span>
                          <span className="text-sm text-foreground">
                            {new Date(essay.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            })}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${essay.nota >= 800 ? 'text-success' :
                            essay.nota >= 600 ? 'text-primary' :
                              'text-warning'
                          }`}>
                          {essay.nota} pts
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <EmptyStateSection
                icon="✍️"
                title="Nenhuma redação ainda"
                description="Faça sua primeira redação para ver seu desempenho aqui."
                href="/redacao"
                buttonText="Fazer Redação"
              />
            )}
          </div>
        )}

        {/* Tab: Questões */}
        {activeTab === 'questoes' && (
          <div className="space-y-6 animate-fadeIn">
            {statistics && statistics.total_questoes_respondidas > 0 ? (
              <>
                {/* Gráfico de Barras */}
                <div className="rounded-xl bg-card-bg p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground mb-4">Desempenho por Disciplina</h2>
                  <div className="h-[250px] sm:h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={disciplinasData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                        <XAxis type="number" tick={{ fontSize: 11 }} />
                        <YAxis dataKey="disciplina" type="category" tick={{ fontSize: 11 }} width={40} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card-bg)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '8px'
                          }}
                          formatter={(value: number, name: string) => [value, name === 'acertos' ? 'Acertos' : 'Total']}
                        />
                        <Bar dataKey="acertos" fill="hsl(var(--success))" name="Acertos" radius={[0, 4, 4, 0]} />
                        <Bar dataKey="total" fill="var(--muted-bg)" name="Total" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Cards de Disciplinas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {disciplinasData.map((d) => (
                    <div key={d.disciplina} className="rounded-xl bg-card-bg p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{d.fullName}</span>
                        <span className={`text-sm font-bold ${d.taxa >= 70 ? 'text-success' :
                            d.taxa >= 50 ? 'text-primary' :
                              'text-danger'
                          }`}>
                          {d.taxa.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted-bg/50 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${d.taxa}%`,
                            backgroundColor: d.color
                          }}
                        />
                      </div>
                      <p className="text-xs text-foreground/50 mt-2">
                        {d.acertos} de {d.total} questões
                      </p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <EmptyStateSection
                icon="🎯"
                title="Nenhum simulado ainda"
                description="Faça seu primeiro simulado para ver seu desempenho aqui."
                href="/questoes"
                buttonText="Fazer Simulado"
              />
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// StatCard component
function StatCard({
  icon,
  label,
  value,
  subtext,
  color
}: {
  icon: string;
  label: string;
  value: string | number;
  subtext?: string;
  color: 'primary' | 'accent' | 'success' | 'warning';
}) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5',
    accent: 'from-accent/20 to-accent/5',
    success: 'from-success/20 to-success/5',
    warning: 'from-warning/20 to-warning/5',
  };

  return (
    <div className={`rounded-xl bg-gradient-to-br ${colorClasses[color]} p-3 sm:p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg sm:text-xl">{icon}</span>
        <span className="text-xs sm:text-sm text-foreground/60">{label}</span>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-foreground">{value}</p>
      {subtext && (
        <p className="text-xs text-foreground/50 mt-0.5">{subtext}</p>
      )}
    </div>
  );
}

// EmptyState component
function EmptyState() {
  return (
    <div className="rounded-xl bg-card-bg p-8 sm:p-12 text-center shadow-sm">
      <div className="text-5xl mb-4">🚀</div>
      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
        Comece sua Jornada!
      </h2>
      <p className="text-sm text-foreground/60 mb-6 max-w-md mx-auto">
        Você ainda não fez nenhuma redação ou simulado. Comece agora para acompanhar seu progresso!
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/redacao" className="btn btn-primary">
          ✍️ Fazer Redação
        </Link>
        <Link href="/questoes" className="btn btn-outline">
          🎯 Fazer Simulado
        </Link>
      </div>
    </div>
  );
}

// EmptyStateSection component
function EmptyStateSection({
  icon,
  title,
  description,
  href,
  buttonText
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
  buttonText: string;
}) {
  return (
    <div className="rounded-xl bg-card-bg p-8 text-center shadow-sm">
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-bold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-foreground/60 mb-4">{description}</p>
      <Link href={href} className="btn btn-primary">
        {buttonText}
      </Link>
    </div>
  );
}
