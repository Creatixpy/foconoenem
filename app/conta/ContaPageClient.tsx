"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import { getUserStatistics, recalculateUserStatistics } from "@/lib/auth/stats-service";
import type { UserStatistics } from "@/lib/auth/types";
import { getBrowserClient, withTimeout } from "@/lib/db";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

type TabType = 'visao-geral' | 'redacoes' | 'questoes';

interface EssayData {
  nota: number;
  created_at: string;
  id: string;
}

export default function ContaPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading, session, refreshAuth } = useAuth();
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [essays, setEssays] = useState<EssayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('visao-geral');
  const authTimeoutFired = useRef(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?next=${encodeURIComponent('/conta')}`);
    }
  }, [authLoading, user, router]);

  // Safety net: if auth stays loading for too long, force recovery so the
  // page never gets stuck on the spinner indefinitely.
  useEffect(() => {
    if (!authLoading) {
      authTimeoutFired.current = false;
      return;
    }

    const timer = setTimeout(() => {
      if (authLoading) {
        authTimeoutFired.current = true;
        void refreshAuth().catch(() => {
          // If recovery also fails, clear loading so redirect kicks in
          setLoading(false);
        });
      }
    }, 15_000);

    return () => clearTimeout(timer);
  }, [authLoading, refreshAuth]);

  // Load data when authenticated
  const loadData = useCallback(async () => {
    if (!user || !session) return;

    try {
      setLoading(true);
      setErrorMessage(null);

      // Fetch statistics and essays in parallel
      const supabase = getBrowserClient();

      const [statsResult, essaysResult] = await Promise.all([
        getUserStatistics(user.id),
        withTimeout(async (signal) =>
          supabase
            .from('essay_results')
            .select('id, nota, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(10)
            .abortSignal(signal)
        ),
      ]);

      setStatistics(statsResult);
      setEssays(essaysResult.data || []);

      if (essaysResult.error) {
        console.warn('Erro ao buscar redações:', essaysResult.error);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setErrorMessage('Erro ao carregar dados. Tentar novamente?');
    } finally {
      setLoading(false);
    }
  }, [user, session]);

  useEffect(() => {
    if (user && session && !authLoading) {
      void loadData();
    } else if (!authLoading && !user) {
      setLoading(false);
    } else if (!authLoading && user && !session) {
      // Session became stale while user exists — attempt to recover
      void refreshAuth().then(() => {
        // If refreshAuth clears user (failed refresh), the redirect effect
        // will handle it. If it succeeds, this effect re-runs with a valid session.
      }).catch(() => {
        setLoading(false);
      });
    }
  }, [user, session, authLoading, loadData, refreshAuth]);

  // Recalculate statistics
  const handleRecalculate = async () => {
    if (!user) return;

    setRecalculating(true);
    setErrorMessage(null);

    try {
      await recalculateUserStatistics(user.id);
      await loadData();
    } catch (error) {
      console.error('Erro ao recalcular:', error);
      setErrorMessage('Falha ao atualizar estatísticas.');
    } finally {
      setRecalculating(false);
    }
  };

  if (authLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <span className="text-lg text-primary">Carregando dados...</span>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-sm text-foreground/60">Carregando...</p>
        </div>
      </main>
    );
  }

  // Data prep for charts
  const disciplinasData = statistics ? [
    {
      disciplina: 'MAT',
      fullName: 'Matemática',
      acertos: statistics.acertos_matematica,
      total: statistics.total_matematica,
      taxa: statistics.total_matematica > 0 ? (statistics.acertos_matematica / statistics.total_matematica * 100) : 0,
      fill: 'var(--color-primary-500)'
    },
    {
      disciplina: 'POR',
      fullName: 'Português',
      acertos: statistics.acertos_portugues,
      total: statistics.total_portugues,
      taxa: statistics.total_portugues > 0 ? (statistics.acertos_portugues / statistics.total_portugues * 100) : 0,
      fill: 'var(--color-danger-500)'
    },
    {
      disciplina: 'NAT',
      fullName: 'Natureza',
      acertos: statistics.acertos_quimica + statistics.acertos_fisica,
      total: statistics.total_quimica + statistics.total_fisica,
      taxa: (statistics.total_quimica + statistics.total_fisica) > 0 ? ((statistics.acertos_quimica + statistics.acertos_fisica) / (statistics.total_quimica + statistics.total_fisica) * 100) : 0,
      fill: 'var(--color-success-500)'
    },
    {
      disciplina: 'HUM',
      fullName: 'Humanas',
      acertos: statistics.acertos_geografia, // Simplificando para demo
      total: statistics.total_geografia,
      taxa: statistics.total_geografia > 0 ? (statistics.acertos_geografia / statistics.total_geografia * 100) : 0,
      fill: 'var(--color-warning-500)'
    },
  ] : [];

  const evolucaoRedacoes = essays.map((essay, index) => ({
    numero: essays.length - index,
    nota: essay.nota,
    data: new Date(essay.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
  })).reverse();

  const initial = profile?.nome_completo?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'E1';

  const tabs: { id: TabType; label: string }[] = [
    { id: 'visao-geral', label: 'VISÃO GERAL' },
    { id: 'redacoes', label: 'REDAÇÕES' },
    { id: 'questoes', label: 'QUESTÕES' },
  ];

  return (
    <div className="bg-background min-h-screen pb-12">
      {/* Decorative Header Bar */}
      <div className="h-4 bg-gradient-to-r from-primary via-accent to-secondary mb-8 border-b-2 border-border-color"></div>

      <div className="container mx-auto px-4 max-w-6xl">

        {/* PLAYER ID CARD */}
        <section className="mb-10 card flex flex-col md:flex-row gap-8 items-center md:items-start relative overflow-hidden">

           {/* Avatar Area */}
           <div className="flex-shrink-0 relative">
             <div className="w-24 h-24 bg-card-bg rounded-2xl border-2 border-border-color shadow-md flex items-center justify-center">
                <span className="text-4xl text-primary font-bold">{initial}</span>
             </div>
             <div className="absolute -bottom-3 -right-3 bg-success text-white rounded-full text-xs px-2 py-1 shadow-sm">
               Online
             </div>
           </div>

           {/* Info Area */}
           <div className="flex-grow text-center md:text-left space-y-2">
             <div className="flex flex-col md:flex-row items-center gap-4">
               <h1 className="text-2xl md:text-3xl font-bold text-primary tracking-wide">
                 {profile?.nome_completo || 'Estudante'}
               </h1>
               <span className="badge badge-purple">Estudante Nível 1</span>
             </div>
             <p className="font-mono text-sm text-foreground/70">{user.email}</p>
           </div>

           {/* Actions */}
           <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
               onClick={handleRecalculate}
               disabled={recalculating}
               className="btn btn-outline w-full md:w-auto"
             >
               {recalculating ? 'Sincronizando...' : '↻ Atualizar'}
             </button>
             <Link href="/conta/editar" className="btn btn-primary w-full md:w-auto">
               Editar perfil
             </Link>
           </div>
        </section>

        {errorMessage && (
          <div className="mb-6 p-4 border-2 border-danger bg-danger-light text-danger font-mono text-sm flex justify-between items-center shadow-sm">
             <span>{errorMessage}</span>
             <button onClick={loadData} className="underline hover:no-underline">Tentar novamente</button>
          </div>
        )}

        {/* CONTROLLER (Tabs) */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 text-sm uppercase tracking-wider transition-all
                ${activeTab === tab.id
                  ? 'bg-primary text-white rounded-xl shadow-md'
                  : 'bg-card-bg text-foreground rounded-xl border border-border-color hover:bg-muted-bg'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* SCREEN (Content) */}
        <div className="animate-fade-in">

          {/* --- DASHBOARD VIEW --- */}
          {activeTab === 'visao-geral' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               <StatCard
                 label="REDAÇÕES"
                 value={statistics?.total_redacoes || 0}
                 icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
                 color="primary"
               />
               <StatCard
                 label="SIMULADOS"
                 value={statistics?.total_simulados || 0}
                 icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                 color="accent"
               />
               <StatCard
                 label="TAXA DE ACERTO"
                 value={`${statistics?.taxa_acerto?.toFixed(0) || 0}%`}
                 icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                 color="success"
               />
               <StatCard
                 label="MELHOR NOTA"
                 value={statistics?.melhor_nota_redacao || 0}
                 icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>}
                 color="warning"
               />

               {/* RECENT ACTIVITY LOG */}
               <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-6">
                 <div className="card">
                   <h3 className="text-sm font-semibold mb-4 border-b-2 border-border-color pb-2">Atividade recente</h3>
                   {essays.length > 0 ? (
                     <div className="space-y-3 font-mono text-sm">
                       {essays.slice(0, 3).map((essay) => (
                         <div key={essay.id} className="flex justify-between items-center p-2 bg-muted-bg/50 border border-border-color/30">
                           <span>Redação Concluída</span>
                           <span className="text-primary font-bold">+{essay.nota} PTS</span>
                         </div>
                       ))}
                     </div>
                   ) : (
                     <div className="text-foreground/50 font-mono text-center py-8 bg-muted-bg border-2 border-dashed border-border-color">
                       Nenhum dado encontrado.
                     </div>
                   )}
                 </div>
               </div>
            </div>
          )}

          {/* --- WRITING VIEW --- */}
          {activeTab === 'redacoes' && (
            <div className="space-y-8">
               <div className="card">
                 <h2 className="text-lg font-semibold mb-6 text-center md:text-left">Histórico de notas</h2>
                 {essays.length > 0 ? (
                    <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolucaoRedacoes}>
                            <XAxis
                            dataKey="data"
                            stroke="var(--foreground)"
                            tick={{fontFamily: 'var(--font-sans)', fontSize: 11}}
                            tickLine={false}
                            axisLine={false}
                            />
                            <YAxis
                            stroke="var(--foreground)"
                            tick={{fontFamily: 'var(--font-sans)', fontSize: 11}}
                            tickLine={false}
                            axisLine={false}
                            />
                            <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card-bg)',
                                border: '2px solid var(--foreground)',
                                fontFamily: 'var(--font-sans)'
                            }}
                            />
                            <Line
                            type="step"
                            dataKey="nota"
                            stroke="var(--primary)"
                            strokeWidth={3}
                            dot={{r: 4, fill: 'var(--foreground)', strokeWidth: 2, stroke: 'var(--primary)'}}
                            activeDot={{r: 6}}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                    </div>
                 ) : (
                    <div className="text-foreground/50 font-mono text-center py-8 bg-muted-bg border-2 border-dashed border-border-color">
                       Nenhuma redação encontrada.
                    </div>
                 )}
               </div>
            </div>
          )}

          {/* --- QUESTS VIEW --- */}
          {activeTab === 'questoes' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card">
                 <h2 className="text-lg font-semibold mb-6">Níveis de competência</h2>
                 <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={disciplinasData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="disciplina"
                          type="category"
                          width={40}
                          tick={{fontFamily: 'var(--font-sans)', fontSize: 11}}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                           cursor={{fill: 'transparent'}}
                           contentStyle={{
                             backgroundColor: 'var(--card-bg)',
                             border: '2px solid var(--foreground)',
                             fontFamily: 'var(--font-sans)'
                           }}
                        />
                        <Bar
                          dataKey="taxa"
                          barSize={20}
                          radius={[0, 4, 4, 0]}
                        />
                     </BarChart>
                   </ResponsiveContainer>
                 </div>
               </div>

               <div className="space-y-4">
                 {disciplinasData.map((d) => (
                    <div key={d.disciplina} className="card p-4 flex items-center justify-between group hover:border-primary transition-colors">
                       <div>
                         <h4 className="font-bold text-xs text-foreground/70 mb-1">{d.fullName}</h4>
                         <div className="w-full h-2 bg-muted-bg rounded-full overflow-hidden">
                           <div className="h-full rounded-full" style={{width: `${d.taxa}%`, backgroundColor: d.fill}} />
                         </div>
                       </div>
                       <span className="text-xl font-bold">{d.taxa.toFixed(0)}%</span>
                    </div>
                 ))}
               </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}

function StatCard({label, value, icon, color}: {label: string, value: string | number, icon: React.ReactNode, color: string}) {
  const accentColor = `var(--color-${color}-500)`;

  return (
    <div className="card p-5 hover:-translate-y-0.5 transition-transform relative overflow-hidden group">
      <div className="bg-primary/10 text-primary rounded-xl p-2 w-10 h-10 flex items-center justify-center mb-3" style={{color: accentColor, backgroundColor: `color-mix(in srgb, ${accentColor} 10%, transparent)`}}>
        {icon}
      </div>
      <h3 className="text-xs font-medium text-foreground/60 mb-2 uppercase tracking-widest">{label}</h3>
      <p className="text-3xl font-bold text-foreground" style={{color: accentColor}}>
        {value}
      </p>
    </div>
  );
}
