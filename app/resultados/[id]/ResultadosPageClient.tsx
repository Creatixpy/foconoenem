'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { EssayResult } from '@/lib/contracts/essay';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type EssayCompetence = EssayResult['competencia1'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const COMPETENCY_LABELS: Record<string, string> = {
  competencia1: 'Domínio da norma culta',
  competencia2: 'Compreensão do tema',
  competencia3: 'Argumentação',
  competencia4: 'Coesão e coerência',
  competencia5: 'Proposta de intervenção',
};

function scoreColor(score: number): string {
  if (score < 400) return 'var(--danger)';
  if (score < 600) return 'var(--warning)';
  if (score < 800) return 'var(--warning-hover)';
  if (score < 900) return 'var(--brand)';
  return 'var(--ai)';
}

function scoreLabel(score: number): string {
  if (score < 400) return 'Precisa melhorar';
  if (score < 600) return 'Em desenvolvimento';
  if (score < 800) return 'Bom';
  if (score < 900) return 'Muito bom';
  return 'Excelente';
}

function compScoreColor(score: number): string {
  if (score < 80) return 'var(--danger)';
  if (score < 120) return 'var(--warning)';
  if (score < 160) return 'var(--warning-hover)';
  if (score < 180) return 'var(--brand)';
  return 'var(--ai)';
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Animated circular progress
// ---------------------------------------------------------------------------
function CircularScore({
  score,
  maxScore = 1000,
}: {
  score: number;
  maxScore?: number;
}) {
  const radius = 90;
  const stroke = 8;
  const normalizedRadius = radius - stroke / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const pct = Math.min(score / maxScore, 1);
  const color = scoreColor(score);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={radius * 2} height={radius * 2} className="-rotate-90">
        {/* background ring */}
        <circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        {/* progress ring */}
        <motion.circle
          cx={radius}
          cy={radius}
          r={normalizedRadius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct) }}
          transition={{ duration: 1.4, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      {/* center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-4xl sm:text-5xl font-bold"
          style={{ color }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          {score}
        </motion.span>
        <span className="text-xs text-[var(--text-3)] mt-1">/ {maxScore}</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Competency card
// ---------------------------------------------------------------------------
function CompetencyCard({
  index,
  label,
  competency,
  delay,
}: {
  index: number;
  label: string;
  competency: EssayCompetence;
  delay: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = (competency.nota / 200) * 100;
  const color = compScoreColor(competency.nota);
  const feedback = competency.comentario || '';
  const isLong = feedback.length > 200;

  return (
    <motion.div
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition-colors"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {index}
          </span>
          <h3 className="text-sm font-semibold text-[var(--text)] truncate">
            {label}
          </h3>
        </div>
        <span className="text-lg font-bold flex-shrink-0" style={{ color }}>
          {competency.nota}
          <span className="text-xs text-[var(--text-3)] font-normal">/200</span>
        </span>
      </div>

      {/* progress bar */}
      <div className="h-2 rounded-full bg-[var(--surface)] overflow-hidden mb-3">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: delay + 0.2 }}
        />
      </div>

      {/* feedback */}
      {feedback && (
        <div>
          <p
            className={`text-sm text-[var(--text-2)] leading-relaxed ${
              !expanded && isLong ? 'line-clamp-3' : ''
            }`}
          >
            {feedback}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs text-[var(--brand)] hover:underline mt-1 cursor-pointer"
            >
              {expanded ? 'Ver menos' : 'Ver mais'}
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function ResultadosPageClient({ result }: { result: EssayResult }) {
  const [essayExpanded, setEssayExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  // Radar chart data
  const radarData = useMemo(() => {
    return [
      { subject: 'Norma culta', value: result.competencia1.nota, fullMark: 200 },
      { subject: 'Tema', value: result.competencia2.nota, fullMark: 200 },
      { subject: 'Argumentação', value: result.competencia3.nota, fullMark: 200 },
      { subject: 'Coesão', value: result.competencia4.nota, fullMark: 200 },
      { subject: 'Intervenção', value: result.competencia5.nota, fullMark: 200 },
    ];
  }, [result]);

  // Share handler
  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const competencies = [
    { key: 'competencia1', data: result.competencia1 },
    { key: 'competencia2', data: result.competencia2 },
    { key: 'competencia3', data: result.competencia3 },
    { key: 'competencia4', data: result.competencia4 },
    { key: 'competencia5', data: result.competencia5 },
  ];

  const essayWords = wordCount(result.redacaoOriginal);

  return (
    <div className="min-h-[80vh] pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* ----------------------------------------------------------------
            SCORE HERO
        ---------------------------------------------------------------- */}
        <motion.section
          className="text-center space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs text-[var(--text-3)]">
            <svg className="w-3.5 h-3.5 text-[var(--brand)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Resultado da redação
          </div>

          {/* circular score */}
          <CircularScore score={result.nota} />

          {/* label */}
          <div>
            <p className="text-lg font-semibold text-[var(--text)]">Nota Final</p>
            <p className="text-sm font-medium mt-0.5" style={{ color: scoreColor(result.nota) }}>
              {scoreLabel(result.nota)}
            </p>
          </div>

          {/* theme */}
          {result.tema && (
            <p className="text-sm text-[var(--text-3)] max-w-lg mx-auto leading-relaxed">
              <span className="text-[var(--text-2)] font-medium">Tema: </span>
              {result.tema}
            </p>
          )}
        </motion.section>

        {/* ----------------------------------------------------------------
            RADAR CHART
        ---------------------------------------------------------------- */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--text)] mb-4">
              Visão geral das competências
            </h2>
            <div className="w-full h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="var(--border)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'var(--text-3)', fontSize: 11 }}
                  />
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 200]}
                    tick={{ fill: 'var(--text-3)', fontSize: 10 }}
                    tickCount={5}
                  />
                  <Radar
                    name="Nota"
                    dataKey="value"
                    stroke="var(--brand)"
                    fill="var(--brand)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value) => [`${value}/200`, 'Nota']}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.section>

        {/* ----------------------------------------------------------------
            COMPETENCY BREAKDOWN
        ---------------------------------------------------------------- */}
        <section>
          <motion.h2
            className="text-lg font-bold text-[var(--text)] mb-5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Análise por Competência
          </motion.h2>
          <div className="space-y-4">
            {competencies.map(({ key, data }, i) => (
              <CompetencyCard
                key={key}
                index={i + 1}
                label={COMPETENCY_LABELS[key]}
                competency={data}
                delay={0.35 + i * 0.08}
              />
            ))}
          </div>
        </section>

        {/* ----------------------------------------------------------------
            FEEDBACK SECTIONS
        ---------------------------------------------------------------- */}
        <motion.section
          className="grid sm:grid-cols-2 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          {/* Pontos Fortes */}
          {result.pontoFortes.length > 0 && (
            <div className="rounded-xl border border-[var(--ai)]/20 bg-[var(--ai)]/5 p-5">
              <h3 className="text-sm font-bold text-[var(--ai)] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Pontos Fortes
              </h3>
              <ul className="space-y-2">
                {result.pontoFortes.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)] leading-relaxed">
                    <svg className="w-4 h-4 text-[var(--ai)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Pontos a Melhorar */}
          {result.pontosAMelhorar.length > 0 && (
            <div className="rounded-xl border border-[var(--brand)]/20 bg-[var(--brand)]/5 p-5">
              <h3 className="text-sm font-bold text-[var(--brand)] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
                Pontos a Melhorar
              </h3>
              <ul className="space-y-2">
                {result.pontosAMelhorar.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[var(--text-2)] leading-relaxed">
                    <svg className="w-4 h-4 text-[var(--brand)] flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                    </svg>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </motion.section>

        {/* Feedback Geral */}
        {result.feedbackGeral && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 sm:p-6">
              <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                </svg>
                Feedback Geral
              </h3>
              <p className="text-sm text-[var(--text-2)] leading-relaxed whitespace-pre-line">
                {result.feedbackGeral}
              </p>
            </div>
          </motion.section>
        )}

        {/* ----------------------------------------------------------------
            ORIGINAL ESSAY
        ---------------------------------------------------------------- */}
        {result.redacaoOriginal && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.9 }}
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
              <button
                onClick={() => setEssayExpanded(!essayExpanded)}
                className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[var(--surface)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[var(--text-3)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                  <span className="text-sm font-semibold text-[var(--text)]">
                    Ver redação original
                  </span>
                  <span className="text-xs text-[var(--text-3)]">
                    {essayWords} palavras
                  </span>
                </div>
                <svg
                  className={`w-5 h-5 text-[var(--text-3)] transition-transform duration-200 ${
                    essayExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              {essayExpanded && (
                <motion.div
                  className="px-5 pb-5 border-t border-[var(--border)]"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="text-sm text-[var(--text-2)] leading-[1.8] whitespace-pre-line mt-4">
                    {result.redacaoOriginal}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* ----------------------------------------------------------------
            ACTION BUTTONS
        ---------------------------------------------------------------- */}
        <motion.section
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          <Link
            href="/redacao"
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-[var(--brand)] text-white font-medium hover:bg-[var(--brand-hover)] transition-colors text-center"
          >
            Fazer nova redação
          </Link>
          <Link
            href="/conta"
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--text-2)] font-medium hover:bg-[var(--surface)] transition-colors text-center"
          >
            Ver meu perfil
          </Link>
          <button
            onClick={handleShare}
            className="w-full sm:w-auto px-6 py-3 rounded-lg border border-[var(--border)] text-[var(--text-2)] font-medium hover:bg-[var(--surface)] transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <svg className="w-4 h-4 text-[var(--ai)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copiado!
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
                </svg>
                Compartilhar
              </>
            )}
          </button>
        </motion.section>
      </div>
    </div>
  );
}
