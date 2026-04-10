'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import type { UserStatistics } from '@/lib/auth/types';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface EssaySummary {
  id: string;
  nota: number;
  created_at: string;
}

interface ContaData {
  statistics: UserStatistics | null;
  essays: EssaySummary[];
}

type TabKey = 'overview' | 'essays' | 'questions';

/* ================================================================== */
/*  Icons                                                              */
/* ================================================================== */

function PenIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838.838-2.872a2 2 0 0 1 .506-.855z" />
    </svg>
  );
}

function BrainIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A5.5 5.5 0 0 0 4 7.5c0 1.5.6 2.9 1.6 3.9C4.6 12.4 4 13.8 4 15.5A5.5 5.5 0 0 0 9.5 21h0" />
      <path d="M14.5 2A5.5 5.5 0 0 1 20 7.5c0 1.5-.6 2.9-1.6 3.9 1 1 1.6 2.4 1.6 3.9a5.5 5.5 0 0 1-5.5 5.7h0" />
      <path d="M12 2v19" />
    </svg>
  );
}

function TargetIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
      <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </svg>
  );
}

function RefreshIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function BookOpenIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

function SpinnerIcon({ size = 18 }: { size?: number }) {
  return (
    <svg className="animate-spin" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function AlertTriangleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function getScoreColor(score: number): string {
  if (score >= 800) return 'var(--success)';
  if (score >= 600) return 'var(--primary)';
  if (score >= 400) return 'var(--warning)';
  return 'var(--danger)';
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function calcLevel(stats: UserStatistics | null): { level: number; xp: number; nextXp: number } {
  if (!stats) return { level: 1, xp: 0, nextXp: 100 };
  const xp = stats.total_redacoes * 50 + stats.total_simulados * 30 + stats.total_questoes_respondidas * 5;
  const level = Math.floor(xp / 100) + 1;
  const nextXp = level * 100;
  return { level, xp: xp % 100, nextXp: 100 };
}

/* ================================================================== */
/*  Animated number                                                    */
/* ================================================================== */

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (value === 0) { setDisplay(0); return; }
    const duration = 800;
    const steps = 30;
    const increment = value / steps;
    let current = 0;
    let step = 0;
    const interval = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), value);
      setDisplay(current);
      if (step >= steps) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <>{display}{suffix}</>;
}

/* ================================================================== */
/*  Skeleton components                                                */
/* ================================================================== */

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-[var(--bg-elevated)] ${className ?? ''}`} />
  );
}

function ProfileSkeleton() {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <SkeletonPulse className="w-20 h-20 !rounded-full shrink-0" />
        <div className="flex-1 space-y-3 w-full">
          <SkeletonPulse className="h-6 w-48" />
          <SkeletonPulse className="h-4 w-36" />
          <SkeletonPulse className="h-5 w-24" />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
          <SkeletonPulse className="h-4 w-16 mb-3" />
          <SkeletonPulse className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="space-y-4 mt-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5">
          <div className="flex items-center gap-4">
            <SkeletonPulse className="w-12 h-12 !rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ================================================================== */
/*  Stat Card                                                          */
/* ================================================================== */

function StatCard({
  label,
  value,
  suffix,
  icon,
  accent,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 group hover:border-[var(--border-hover)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">{label}</span>
        <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`, color: accent }}>
          {icon}
        </span>
      </div>
      <div className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">
        <AnimatedNumber value={value} suffix={suffix} />
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Tabs                                                               */
/* ================================================================== */

const TABS: { key: TabKey; label: string }[] = [
  { key: 'overview', label: 'Visão Geral' },
  { key: 'essays', label: 'Redações' },
  { key: 'questions', label: 'Questões' },
];

/* ================================================================== */
/*  Empty State                                                        */
/* ================================================================== */

function EmptyState({ title, description, href, cta }: { title: string; description: string; href: string; cta: string }) {
  return (
    <div className="text-center py-16 px-4">
      <div className="mx-auto w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] flex items-center justify-center text-[var(--text-muted)] mb-5">
        <BookOpenIcon />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-2 text-sm text-[var(--text-muted)] max-w-sm mx-auto">{description}</p>
      <Link
        href={href}
        className="
          inline-flex items-center gap-2 mt-6
          px-5 py-2.5 rounded-xl text-sm font-semibold
          bg-[var(--primary)] text-white
          hover:bg-[var(--primary-hover)] transition-colors
        "
      >
        {cta}
      </Link>
    </div>
  );
}

/* ================================================================== */
/*  Competency Chart                                                   */
/* ================================================================== */

const COMPETENCY_NAMES = [
  'C1: Norma culta',
  'C2: Compreensão',
  'C3: Argumentação',
  'C4: Coesão',
  'C5: Proposta',
];

function CompetencyChart({ stats }: { stats: UserStatistics }) {
  const data = COMPETENCY_NAMES.map((name, i) => {
    const key = `media_competencia${i + 1}` as keyof UserStatistics;
    return { subject: name, value: (stats[key] as number | null) ?? 0, fullMark: 200 };
  });

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Competências</h3>
      <p className="text-xs text-[var(--text-muted)] mb-6">Média por competência ENEM (máx. 200)</p>
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--border-color)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
            />
            <PolarRadiusAxis angle={90} domain={[0, 200]} tick={false} axisLine={false} />
            <Radar
              dataKey="value"
              stroke="var(--primary)"
              fill="var(--primary)"
              fillOpacity={0.15}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Discipline Accuracy Chart                                          */
/* ================================================================== */

const DISCIPLINES = [
  { key: 'matematica', label: 'Matemática' },
  { key: 'portugues', label: 'Português' },
  { key: 'quimica', label: 'Química' },
  { key: 'fisica', label: 'Física' },
  { key: 'geografia', label: 'Geografia' },
] as const;

function DisciplineChart({ stats }: { stats: UserStatistics }) {
  const data = DISCIPLINES.map(({ key, label }) => {
    const acertos = stats[`acertos_${key}` as keyof UserStatistics] as number;
    const total = stats[`total_${key}` as keyof UserStatistics] as number;
    const taxa = total > 0 ? Math.round((acertos / total) * 100) : 0;
    return { name: label, taxa, total };
  }).filter((d) => d.total > 0);

  if (data.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
      <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">Taxa de acerto por disciplina</h3>
      <p className="text-xs text-[var(--text-muted)] mb-6">Percentual de acerto (%)</p>
      <div className="w-full h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={{ stroke: 'var(--border-color)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={35}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                fontSize: '13px',
                color: 'var(--text-primary)',
              }}
              formatter={(value) => [`${value}%`, 'Acerto']}
            />
            <Bar dataKey="taxa" fill="var(--primary)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Essay Row                                                          */
/* ================================================================== */

function EssayRow({ essay, compact }: { essay: EssaySummary; compact?: boolean }) {
  const color = getScoreColor(essay.nota);

  return (
    <Link
      href={`/resultados/${essay.id}`}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-colors group"
    >
      <span
        className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`, color }}
      >
        {essay.nota}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
          Redação #{essay.id.slice(0, 8)}
        </p>
        <p className="text-xs text-[var(--text-muted)]">{formatDate(essay.created_at)}</p>
      </div>
      {!compact && (
        <span className="text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors shrink-0">
          <ExternalLinkIcon />
        </span>
      )}
    </Link>
  );
}

/* ================================================================== */
/*  Tab Contents                                                       */
/* ================================================================== */

function OverviewTab({ stats, essays }: { stats: UserStatistics | null; essays: EssaySummary[] }) {
  if (!stats) {
    return (
      <EmptyState
        title="Nenhuma atividade ainda"
        description="Comece fazendo uma redação ou um simulado para ver suas estatísticas aqui."
        href="/redacao"
        cta="Fazer minha primeira redação"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Competency chart */}
      {stats.total_redacoes > 0 && <CompetencyChart stats={stats} />}

      {/* Discipline chart */}
      {stats.total_questoes_respondidas > 0 && <DisciplineChart stats={stats} />}

      {/* Recent essays */}
      <div className={`rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 ${stats.total_redacoes > 0 && stats.total_questoes_respondidas > 0 ? 'lg:col-span-2' : ''}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Redações recentes</h3>
          {essays.length > 0 && (
            <Link href="/redacao" className="text-xs font-medium text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors">
              Ver todas →
            </Link>
          )}
        </div>
        {essays.length > 0 ? (
          <div className="divide-y divide-[var(--border-color)]">
            {essays.slice(0, 5).map((e) => (
              <EssayRow key={e.id} essay={e} compact />
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--text-muted)] py-4 text-center">
            Nenhuma redação enviada ainda.
          </p>
        )}
      </div>
    </div>
  );
}

function EssaysTab({ essays }: { essays: EssaySummary[] }) {
  if (essays.length === 0) {
    return (
      <EmptyState
        title="Nenhuma redação enviada"
        description="Que tal escrever sua primeira redação e receber feedback da nossa IA?"
        href="/redacao"
        cta="Escrever redação"
      />
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden">
      <div className="divide-y divide-[var(--border-color)]">
        {essays.map((e) => (
          <EssayRow key={e.id} essay={e} />
        ))}
      </div>
    </div>
  );
}

function QuestionsTab({ stats }: { stats: UserStatistics | null }) {
  if (!stats || stats.total_questoes_respondidas === 0) {
    return (
      <EmptyState
        title="Nenhum simulado realizado"
        description="Pratique com nossos simulados personalizados e veja sua evolução por disciplina."
        href="/questoes"
        cta="Começar simulado"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 text-center">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Total de questões</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total_questoes_respondidas}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 text-center">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Acertos</p>
          <p className="text-2xl font-bold text-[var(--success)]">{stats.total_acertos}</p>
        </div>
        <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-5 text-center">
          <p className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider mb-1">Taxa de acerto</p>
          <p className="text-2xl font-bold text-[var(--primary)]">{Math.round(stats.taxa_acerto ?? 0)}%</p>
        </div>
      </div>

      {/* Discipline chart */}
      <DisciplineChart stats={stats} />

      {/* Discipline breakdown */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6">
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-4">Detalhamento por disciplina</h3>
        <div className="space-y-3">
          {DISCIPLINES.map(({ key, label }) => {
            const acertos = stats[`acertos_${key}` as keyof UserStatistics] as number;
            const total = stats[`total_${key}` as keyof UserStatistics] as number;
            if (total === 0) return null;
            const pct = Math.round((acertos / total) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-sm text-[var(--text-secondary)] w-24 shrink-0">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 70 ? 'var(--success)' : pct >= 50 ? 'var(--primary)' : 'var(--warning)',
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-[var(--text-muted)] w-14 text-right">
                  {acertos}/{total} ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function ContaPageClient() {
  const router = useRouter();
  const { user, profile, initialized, loading: authLoading } = useAuth();

  const [data, setData] = useState<ContaData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState('');
  const [recalculating, setRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // Auth guard
  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login');
    }
  }, [initialized, user, router]);

  // Fetch dashboard data
  const fetchData = useCallback(async () => {
    setDataLoading(true);
    setDataError('');
    try {
      const res = await fetch('/api/conta/dados');
      if (!res.ok) throw new Error('Erro ao carregar dados');
      const json = await res.json();
      setData(json);
    } catch {
      setDataError('Não foi possível carregar seus dados.');
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialized && user) fetchData();
  }, [initialized, user, fetchData]);

  // Recalculate stats
  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const res = await fetch('/api/conta/recalcular', { method: 'POST' });
      if (!res.ok) throw new Error('Erro');
      await fetchData();
    } catch {
      // silent — data will just not refresh
    } finally {
      setRecalculating(false);
    }
  }

  // Loading states
  if (!initialized || authLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-6">
        <ProfileSkeleton />
        <StatsSkeleton />
        <ContentSkeleton />
      </div>
    );
  }

  if (!user) return null;

  const stats = data?.statistics ?? null;
  const essays = data?.essays ?? [];
  const { level, xp, nextXp } = calcLevel(stats);
  const displayName = profile?.nome_completo || user.email?.split('@')[0] || 'Usuário';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* ---- Profile Header Card ---- */}
      <div className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Avatar */}
          <div className="relative shrink-0 self-start">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--primary)] to-[#6366F1] flex items-center justify-center text-2xl font-bold text-white select-none">
              {getInitials(profile?.nome_completo)}
            </div>
            {/* Online dot */}
            <span className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full bg-[var(--success)] border-[3px] border-[var(--card-bg)]" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight truncate">
              {displayName}
            </h1>
            <p className="text-sm text-[var(--text-muted)] mt-0.5 truncate">{user.email}</p>

            {/* Level badge + XP bar */}
            <div className="mt-4 flex items-center gap-3">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                Estudante Nível {level}
              </span>
              <div className="flex items-center gap-2 flex-1 max-w-[200px]">
                <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-elevated)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[var(--primary)] transition-all duration-700"
                    style={{ width: `${(xp / nextXp) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">{xp}/{nextXp} XP</span>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleRecalculate}
                disabled={recalculating}
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  border border-[var(--border-color)] text-[var(--text-secondary)]
                  bg-transparent hover:bg-[var(--bg-elevated)]
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-colors
                "
              >
                {recalculating ? <SpinnerIcon size={14} /> : <RefreshIcon />}
                Atualizar
              </button>
              <Link
                href="/conta/editar"
                className="
                  inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
                  bg-[var(--primary)] text-white
                  hover:bg-[var(--primary-hover)] transition-colors
                "
              >
                Editar Perfil
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---- Stats Overview ---- */}
      {dataLoading ? (
        <StatsSkeleton />
      ) : dataError ? (
        <div className="rounded-2xl border border-[var(--danger)]/30 bg-[var(--danger-light)] p-5 flex items-center gap-3">
          <span className="text-[var(--danger)]"><AlertTriangleIcon /></span>
          <span className="text-sm text-[var(--danger)] flex-1">{dataError}</span>
          <button onClick={fetchData} className="text-sm font-medium text-[var(--primary)] hover:underline">
            Tentar novamente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Redações"
            value={stats?.total_redacoes ?? 0}
            icon={<PenIcon />}
            accent="var(--primary)"
          />
          <StatCard
            label="Simulados"
            value={stats?.total_simulados ?? 0}
            icon={<BrainIcon />}
            accent="#8B5CF6"
          />
          <StatCard
            label="Taxa de acerto"
            value={Math.round(stats?.taxa_acerto ?? 0)}
            suffix="%"
            icon={<TargetIcon />}
            accent="var(--success)"
          />
          <StatCard
            label="Melhor nota"
            value={stats?.melhor_nota_redacao ?? 0}
            icon={<TrophyIcon />}
            accent="var(--warning)"
          />
        </div>
      )}

      {/* ---- Tabs ---- */}
      <div>
        <div className="flex gap-1 p-1 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                ${activeTab === tab.key
                  ? 'bg-[var(--bg-elevated)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="mt-6">
          {dataLoading ? (
            <ContentSkeleton />
          ) : (
            <>
              {activeTab === 'overview' && <OverviewTab stats={stats} essays={essays} />}
              {activeTab === 'essays' && <EssaysTab essays={essays} />}
              {activeTab === 'questions' && <QuestionsTab stats={stats} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
