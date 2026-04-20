'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';

const CONFETTI_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

interface ConfettiConfig {
  color: string;
  delay: number;
  drift: number;
  rotate: number;
  x: number;
}

function buildConfetti(count: number): ConfettiConfig[] {
  return Array.from({ length: count }, (_, index) => ({
    color: CONFETTI_COLORS[index % CONFETTI_COLORS.length],
    delay: index * 0.06,
    drift: ((index * 37) % 220) - 110,
    rotate: index % 2 === 0 ? 360 : -360,
    x: (index * 17) % 100,
  }));
}

const CONFETTI_PARTICLES = buildConfetti(40);

function ConfettiParticle({ color, delay, drift, rotate, x }: ConfettiConfig) {

  return (
    <motion.div
      className="absolute w-2 h-2 rounded-full"
      style={{ backgroundColor: color, left: `${x}%`, top: '-8px' }}
      initial={{ opacity: 1, y: 0, rotate: 0 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, 400, 600],
        x: [0, drift],
        rotate: [0, rotate],
      }}
      transition={{ duration: 3, delay, ease: 'easeOut' }}
    />
  );
}

function SucessoContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const handleShare = async () => {
    const text = 'Acabei de apoiar o FocoNoEnem! 💙 Uma plataforma gratuita que ajuda estudantes a se prepararem para o ENEM com IA. Conheça: https://foconoenem.com';
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // user cancelled
      }
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4 relative overflow-hidden">
      {/* Confetti */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {CONFETTI_PARTICLES.map((particle, index) => (
            <ConfettiParticle key={index} {...particle} />
          ))}
        </div>
      )}

      <motion.div
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* Heart icon */}
        <motion.div
          className="text-6xl mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          💚
        </motion.div>

        <motion.h1
          className="text-3xl md:text-4xl font-bold text-text-primary mb-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          Obrigado pelo seu apoio!
        </motion.h1>

        <motion.p
          className="text-text-secondary text-lg mb-2 leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Você está ajudando estudantes a conquistar sua vaga na universidade.
        </motion.p>

        <motion.p
          className="text-text-muted text-sm mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Sua generosidade faz a diferença! 🎓
        </motion.p>

        {sessionId && (
          <motion.div
            className="mb-8 p-4 rounded-xl bg-card-bg border border-border-color"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-xs text-text-muted mb-1">ID da transação</p>
            <p className="text-sm text-text-secondary font-mono break-all">
              {sessionId.slice(0, 28)}...
            </p>
          </motion.div>
        )}

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Link
            href="/"
            className="px-6 py-3 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2"
          >
            Voltar para o início
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </Link>
          <button
            onClick={handleShare}
            className="px-6 py-3 rounded-xl border border-border-color text-text-secondary hover:text-text-primary hover:border-border-hover transition-colors font-medium inline-flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Compartilhar
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function DoacaoSucessoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg-base flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    }>
      <SucessoContent />
    </Suspense>
  );
}
