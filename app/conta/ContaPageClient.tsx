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
        <div className="font-pixel text-xl animate-pulse text-primary">CARREGANDO DADOS...</div>
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
          <div className="font-pixel text-xl text-primary animate-bounce">CARREGANDO...</div>
          <p className="text-sm font-mono text-foreground/60">Preparando Painel...</p>
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
           {/* Retro Corner Deco */}
           <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
           <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
           <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
           <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>

           {/* Avatar Area */}
           <div className="flex-shrink-0 relative">
             <div className="w-24 h-24 bg-card-bg border-4 border-foreground shadow-[4px_4px_0px_var(--foreground)] flex items-center justify-center">
                <span className="font-pixel text-4xl text-primary animate-pulse">{initial}</span>
             </div>
             <div className="absolute -bottom-3 -right-3 bg-success text-white text-[10px] font-pixel px-2 py-1 border-2 border-foreground shadow-sm">
               ONLINE
             </div>
           </div>

           {/* Info Area */}
           <div className="flex-grow text-center md:text-left space-y-2">
             <div className="flex flex-col md:flex-row items-center gap-4">
               <h1 className="text-2xl md:text-3xl font-pixel text-primary uppercase tracking-wide">
                 {profile?.nome_completo || 'Estudante'}
               </h1>
               <span className="badge badge-purple">Estudante Nível 1</span>
             </div>
             <p className="font-mono text-sm text-foreground/70">{user.email}</p>

             {/* XP Bar (Visual Only) */}
             <div className="mt-4 w-full max-w-md bg-muted-bg border-2 border-foreground h-6 relative mx-auto md:mx-0">
               <div className="bg-gradient-to-r from-primary to-accent h-full w-[65%] border-r-2 border-foreground"></div>
               <span className="absolute inset-0 flex items-center justify-center text-[10px] font-pixel text-foreground font-bold tracking-widest">
                 XP: 1350 / 2000
               </span>
             </div>
           </div>

           {/* Actions */}
           <div className="flex flex-col gap-3 w-full md:w-auto">
             <button
               onClick={handleRecalculate}
               disabled={recalculating}
               className="btn btn-outline w-full md:w-auto"
             >
               {recalculating ? 'SINCRONIZANDO...' : '↻ ATUALIZAR'}
             </button>
             <Link href="/conta/editar" className="btn btn-primary w-full md:w-auto">
               EDITAR PERFIL
             </Link>
           </div>
        </section>

        {errorMessage && (
          <div className="mb-6 p-4 border-2 border-danger bg-danger-light text-danger font-mono text-sm flex justify-between items-center shadow-sm">
             <span>👾 ERRO: {errorMessage}</span>
             <button onClick={loadData} className="underline hover:no-underline">TENTAR NOVAMENTE</button>
          </div>
        )}

        {/* CONTROLLER (Tabs) */}
        <div className="flex flex-wrap gap-4 mb-8 justify-center md:justify-start">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-6 py-3 border-2 font-pixel text-xs uppercase tracking-wider transition-all
                ${activeTab === tab.id
                  ? 'bg-primary text-white border-foreground shadow-[4px_4px_0px_var(--foreground)] translate-x-[-2px] translate-y-[-2px]'
                  : 'bg-card-bg text-foreground border-border-color hover:bg-muted-bg hover:shadow-[2px_2px_0px_var(--border-color)]'
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
               <RetroStatCard
                 label="REDAÇÕES"
                 value={statistics?.total_redacoes || 0}
                 icon="📝"
                 color="primary"
               />
               <RetroStatCard
                 label="SIMULADOS"
                 value={statistics?.total_simulados || 0}
                 icon="⚔️"
                 color="accent"
               />
               <RetroStatCard
                 label="TAXA DE ACERTO"
                 value={`${statistics?.taxa_acerto?.toFixed(0) || 0}%`}
                 icon="🎯"
                 color="success"
               />
               <RetroStatCard
                 label="MELHOR NOTA"
                 value={statistics?.melhor_nota_redacao || 0}
                 icon="🏆"
                 color="warning"
               />

               {/* RECENT ACTIVITY LOG */}
               <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-6">
                 <div className="card">
                   <h3 className="font-pixel text-sm mb-4 border-b-2 border-border-color pb-2">ATIVIDADE RECENTE</h3>
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
                       NENHUM DADO ENCONTRADO.
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
                 <h2 className="font-pixel text-lg mb-6 text-center md:text-left">HISTÓRICO DE NOTAS</h2>
                 {essays.length > 0 ? (
                    <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={evolucaoRedacoes}>
                            <XAxis
                            dataKey="data"
                            stroke="var(--foreground)"
                            tick={{fontFamily: 'monospace', fontSize: 10}}
                            tickLine={false}
                            axisLine={false}
                            />
                            <YAxis
                            stroke="var(--foreground)"
                            tick={{fontFamily: 'monospace', fontSize: 10}}
                            tickLine={false}
                            axisLine={false}
                            />
                            <Tooltip
                            contentStyle={{
                                backgroundColor: 'var(--card-bg)',
                                border: '2px solid var(--foreground)',
                                fontFamily: 'monospace'
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
                       NENHUMA REDAÇÃO ENCONTRADA.
                    </div>
                 )}
               </div>
            </div>
          )}

          {/* --- QUESTS VIEW --- */}
          {activeTab === 'questoes' && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="card">
                 <h2 className="font-pixel text-lg mb-6">NÍVEIS DE COMPETÊNCIA</h2>
                 <div className="h-[300px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={disciplinasData} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="disciplina"
                          type="category"
                          width={40}
                          tick={{fontFamily: 'var(--font-pixel)', fontSize: 10}}
                          axisLine={false}
                          tickLine={false}
                        />
                        <Tooltip
                           cursor={{fill: 'transparent'}}
                           contentStyle={{
                             backgroundColor: 'var(--card-bg)',
                             border: '2px solid var(--foreground)',
                             fontFamily: 'monospace'
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
                         <h4 className="font-bold font-pixel text-xs text-foreground/70 mb-1">{d.fullName}</h4>
                         <div className="flex gap-1">
                           {/* Pixel Health Bar */}
                           {Array.from({length: 10}).map((_, i) => (
                             <div
                               key={i}
                               className={`w-2 h-4 border border-foreground/20 ${i < (d.taxa / 10) ? 'bg-current text-primary' : 'bg-transparent'}`}
                               style={{backgroundColor: i < (d.taxa / 10) ? d.fill : 'transparent'}}
                             ></div>
                           ))}
                         </div>
                       </div>
                       <span className="font-pixel text-xl">{d.taxa.toFixed(0)}%</span>
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

function RetroStatCard({label, value, icon, color}: {label: string, value: string | number, icon: string, color: string}) {
  const borderColor = `var(--color-${color}-500)`;

  return (
    <div className="bg-card-bg border-2 border-foreground p-4 shadow-[4px_4px_0px_var(--foreground)] relative overflow-hidden group hover:-translate-y-1 transition-transform">
      <div className="absolute top-0 right-0 p-2 opacity-20 font-pixel text-4xl group-hover:scale-110 transition-transform group-hover:opacity-40">
        {icon}
      </div>
      <h3 className="font-pixel text-[10px] text-foreground/60 mb-2 uppercase tracking-widest">{label}</h3>
      <p className="font-mono text-3xl font-bold text-foreground" style={{color: borderColor}}>
        {value}
      </p>
    </div>
  );
}
