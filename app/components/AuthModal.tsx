"use client";

import { useState } from 'react';
import { signIn, signUp } from '@/lib/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await signIn(email, password);
        onClose();
        window.location.reload(); // Recarregar para atualizar o contexto
      } else {
        await signUp(email, password, nomeCompleto);
        setSuccess(true);
      }
    } catch (err) {
      setError((err as Error).message || 'Erro ao autenticar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError(null);
    setSuccess(false);
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="card card-gradient max-w-md w-full p-8 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-foreground opacity-60 hover:opacity-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Conta criada com sucesso!
            </h2>
            <p className="text-foreground opacity-80 mb-6">
              Verifique seu email para confirmar sua conta e fazer login.
            </p>
            <button
              onClick={onClose}
              className="btn btn-primary w-full"
            >
              Entendi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="card card-gradient max-w-md w-full p-8 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-foreground opacity-60 hover:opacity-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold text-foreground mb-2">
          {mode === 'login' ? 'Entrar' : 'Criar Conta'}
        </h2>
        <p className="text-foreground opacity-70 mb-6">
          {mode === 'login' 
            ? 'Acesse sua conta para ver seu progresso' 
            : 'Crie uma conta gratuita e acompanhe sua evolução'}
        </p>

        {error && (
          <div className="bg-danger-light border border-danger text-danger p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Nome Completo
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
                className="w-full"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full"
              placeholder="••••••••"
            />
            {mode === 'register' && (
              <p className="text-xs text-foreground opacity-60 mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="loader-small mr-2"></div>
                Processando...
              </span>
            ) : (
              mode === 'login' ? 'Entrar' : 'Criar Conta'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-primary hover:text-primary-dark text-sm font-medium"
          >
            {mode === 'login' 
              ? 'Não tem conta? Criar uma agora' 
              : 'Já tem conta? Fazer login'}
          </button>
        </div>

        {mode === 'login' && (
          <div className="mt-4 text-center">
            <button
              onClick={onClose}
              className="text-foreground opacity-60 hover:opacity-80 text-sm"
            >
              Continuar sem login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
