'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'motion/react';

const presetAmounts = [5, 10, 25, 50, 100];

const impactCards = [
  { amount: 'R$5', desc: 'Ajuda a manter o servidor funcionando por 1 hora', icon: '⚡' },
  { amount: 'R$10', desc: 'Custeia o processamento de 5 correções de redação', icon: '✍️' },
  { amount: 'R$25', desc: 'Mantém a plataforma gratuita por 1 dia inteiro', icon: '🌟' },
  { amount: 'R$50', desc: 'Contribui para melhorias e novas funcionalidades', icon: '🚀' },
  { amount: 'R$100', desc: 'Ajuda a expandir o acesso para mais estudantes', icon: '🎓' },
];

import { Suspense } from 'react';

function DoacaoContent() {
  const searchParams = useSearchParams();
  const canceled = searchParams.get('canceled') === 'true';

  const [selectedAmount, setSelectedAmount] = useState<number>(25);
  const [customAmount, setCustomAmount] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const effectiveAmount = isCustom ? Number(customAmount) || 0 : selectedAmount;

  const handlePresetClick = (amount: number) => {
    setSelectedAmount(amount);
    setIsCustom(false);
    setCustomAmount('');
    setError('');
  };

  const handleCustomFocus = () => {
    setIsCustom(true);
    setError('');
  };

  const handleDonate = async () => {
    if (effectiveAmount < 5) {
      setError('O valor mínimo de doação é R$ 5,00.');
      return;
    }
    if (effectiveAmount > 10000) {
      setError('O valor máximo por transação é R$ 10.000,00.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/doacao/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: effectiveAmount }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Erro ao processar doação.');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Hero */}
      <section className="relative py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-5xl mb-6 block">❤️</span>
          </motion.div>
          <motion.h1
            className="text-4xl md:text-5xl font-bold text-text mb-4 tracking-tight"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            Apoie a AprovIA
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-text-2 max-w-xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          >
            Sua contribuição ajuda a manter a plataforma gratuita e acessível para milhares de estudantes em todo o Brasil.
          </motion.p>
        </div>
      </section>

      {/* Donation Card */}
      <section className="px-4 -mt-8 pb-20">
        <motion.div
          className="max-w-lg mx-auto p-8 rounded-2xl bg-surface border border-border"
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        >
          {canceled && (
            <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20 text-sm text-warning">
              Doação cancelada. Você pode tentar novamente quando quiser.
            </div>
          )}

          <h2 className="text-xl font-semibold text-text mb-1">Escolha um valor</h2>
          <p className="text-sm text-text-3 mb-6">Qualquer valor faz diferença ✨</p>

          {/* Preset amounts */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            {presetAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                  !isCustom && selectedAmount === amount
                    ? 'bg-brand text-white shadow-sm'
                    : 'bg-surface-2 text-text-2 hover:text-text hover:bg-surface-2 border border-border'
                }`}
              >
                R${amount}
              </button>
            ))}
          </div>

          {/* Custom amount */}
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-3 text-sm font-medium">R$</span>
            <input
              type="number"
              placeholder="Outro valor"
              value={customAmount}
              onChange={(e) => { setCustomAmount(e.target.value); setError(''); }}
              onFocus={handleCustomFocus}
              min={5}
              max={10000}
              className={`w-full pl-10 pr-4 py-3 rounded-xl bg-surface-2 border text-text placeholder:text-text-3 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand/40 ${
                isCustom ? 'border-brand' : 'border-border'
              }`}
            />
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-danger-light text-danger text-sm">
              {error}
            </div>
          )}

          {/* Donate button */}
          <button
            onClick={handleDonate}
            disabled={loading || effectiveAmount < 5}
            className="w-full py-3.5 rounded-xl bg-brand text-white font-semibold hover:bg-brand-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Processando...
              </>
            ) : (
              `Apoiar com R$${effectiveAmount > 0 ? effectiveAmount : '...'}`
            )}
          </button>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-4 text-text-3">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-xs">Pagamento seguro via Stripe</span>
          </div>
        </motion.div>
      </section>

      {/* Impact Cards */}
      <section className="py-20 px-4 bg-surface">
        <div className="max-w-4xl mx-auto">
          <motion.h2
            className="text-2xl md:text-3xl font-bold text-text text-center mb-4"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Seu impacto
          </motion.h2>
          <motion.p
            className="text-text-2 text-center mb-12 max-w-lg mx-auto"
            initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
          >
            Veja como cada contribuição ajuda a transformar a educação.
          </motion.p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {impactCards.map((card, i) => (
              <motion.div
                key={i}
                className="p-5 rounded-xl bg-surface border border-border text-center"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <span className="text-2xl mb-3 block">{card.icon}</span>
                <p className="text-lg font-bold text-brand mb-1">{card.amount}</p>
                <p className="text-xs text-text-2 leading-relaxed">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom message */}
      <section className="py-16 px-4 text-center">
        <p className="text-text-2 max-w-md mx-auto leading-relaxed">
          A AprovIA é e sempre será gratuita. Doações são 100% voluntárias e usadas exclusivamente para manter e melhorar a plataforma. 💙
        </p>
      </section>
    </div>
  );
}

export default function DoacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-brand border-t-transparent rounded-full" />
      </div>
    }>
      <DoacaoContent />
    </Suspense>
  );
}
