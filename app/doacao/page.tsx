'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const DONATION_AMOUNTS = [
  { value: 5, label: 'R$ 5', description: 'Ajuda básica' },
  { value: 10, label: 'R$ 10', description: 'Uma correção de redação' },
  { value: 25, label: 'R$ 25', description: 'Um dia de servidor' },
  { value: 50, label: 'R$ 50', description: 'Uma semana de IA' },
  { value: 100, label: 'R$ 100', description: 'Um mês de apoio' },
];

export default function DoacaoPage() {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(25);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDonation = async () => {
    try {
      setError(null);
      setIsProcessing(true);

      const amount = selectedAmount === null 
        ? parseFloat(customAmount) 
        : selectedAmount;

      if (!amount || amount < 5) {
        setError('O valor mínimo de doação é R$ 5,00');
        setIsProcessing(false);
        return;
      }

      // Criar sessão de checkout
      const response = await fetch('/api/doacao/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar doação');
      }

      // Redirecionar para a URL do Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout não recebida');
      }
    } catch (err: any) {
      console.error('Erro na doação:', err);
      setError(err.message || 'Erro ao processar doação');
      setIsProcessing(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setError(null);
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setSelectedAmount(null);
    setError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto p-4 md:p-8 max-w-4xl">
        <div className="card card-gradient p-8 md:p-12 mb-8 animate-fadeIn">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <svg
                className="w-12 h-12 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Apoie o Foco no ENEM
            </h1>
            <p className="text-lg text-foreground opacity-90 max-w-2xl mx-auto">
              Sua doação ajuda a manter o projeto funcionando e ajudando milhares de estudantes a se prepararem para o ENEM. 
              Toda contribuição faz a diferença! ❤️
            </p>
          </div>

          {/* Valores sugeridos */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Escolha um valor</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {DONATION_AMOUNTS.map((amount) => (
                <button
                  key={amount.value}
                  onClick={() => handleAmountSelect(amount.value)}
                  disabled={isProcessing}
                  className={`card card-interactive p-4 text-center transition-all duration-300 ${
                    selectedAmount === amount.value
                      ? 'border-2 border-primary bg-primary/10'
                      : 'border-2 border-transparent hover:border-primary/40'
                  } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="text-2xl font-bold text-primary mb-1">
                    {amount.label}
                  </div>
                  <div className="text-xs text-foreground opacity-70">
                    {amount.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Valor personalizado */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-center">Ou escolha seu valor</h2>
            <div className="max-w-md mx-auto">
              <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-foreground text-lg font-semibold">
                  R$
                </span>
                <input
                  type="number"
                  min="5"
                  step="1"
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  placeholder="Digite o valor"
                  disabled={isProcessing}
                  className="w-full pl-12 pr-4 py-4 text-lg rounded-lg border-2 border-muted-border bg-card-bg text-foreground focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
                />
              </div>
              <p className="text-sm text-foreground opacity-70 mt-2 text-center">
                Valor mínimo: R$ 5,00
              </p>
            </div>
          </div>

          {/* Mensagem de erro */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Botão de doação */}
          <div className="text-center">
            <button
              onClick={handleDonation}
              disabled={isProcessing || (!selectedAmount && !customAmount)}
              className="btn btn-primary btn-lg px-12 py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Processando...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                    />
                  </svg>
                  Doar Agora
                </>
              )}
            </button>
          </div>

          {/* Informações sobre segurança */}
          <div className="mt-8 pt-8 border-t border-muted-border">
            <div className="text-center text-sm text-foreground opacity-70">
              <div className="flex items-center justify-center gap-2 mb-2">
                <svg
                  className="w-5 h-5 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                <span className="font-semibold">Pagamento 100% seguro via Stripe</span>
              </div>
              <p>
                Seus dados são protegidos com criptografia de ponta a ponta.
                <br />
                Não armazenamos informações de cartão de crédito.
              </p>
            </div>
          </div>
        </div>

        {/* Seção de impacto */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="card card-gradient p-6 text-center">
            <div className="text-3xl mb-2">📚</div>
            <h3 className="text-lg font-semibold mb-2">Conteúdo Grátis</h3>
            <p className="text-sm opacity-80">
              Mantemos todo o conteúdo gratuito e acessível para todos
            </p>
          </div>
          <div className="card card-gradient p-6 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <h3 className="text-lg font-semibold mb-2">IA Avançada</h3>
            <p className="text-sm opacity-80">
              Correção de redações e geração de questões com inteligência artificial
            </p>
          </div>
          <div className="card card-gradient p-6 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="text-lg font-semibold mb-2">Suporte Contínuo</h3>
            <p className="text-sm opacity-80">
              Melhorias constantes e novos recursos para os estudantes
            </p>
          </div>
        </div>

        {/* Link de volta */}
        <div className="text-center">
          <Link href="/" className="text-primary hover:underline">
            ← Voltar para a página inicial
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
