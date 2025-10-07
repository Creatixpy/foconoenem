"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/app/contexts/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/conta");
    }
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    if (!objetivo.trim()) {
      setFormError("Conte para nós qual é o seu principal objetivo.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await signUp(email.trim(), password, nomeCompleto.trim(), objetivo.trim());
      setSuccess(true);
    } catch (error) {
      setFormError((error as Error)?.message ?? "Não foi possível criar a conta. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!nomeCompleto.trim()) {
      setFormError("Informe seu nome completo antes de continuar com o Google.");
      return;
    }

    if (!objetivo.trim()) {
      setFormError("Conte para nós qual é o seu principal objetivo antes de continuar com o Google.");
      return;
    }

    setFormError(null);
    setSubmitting(true);

    try {
      await signInWithGoogle({
        nomeCompleto: nomeCompleto.trim(),
        objetivo: objetivo.trim(),
      });
      // Redirecionamento ocorre no fluxo OAuth
    } catch (error) {
      setFormError((error as Error)?.message ?? "Erro ao autenticar com Google.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted-bg">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-24 max-w-4xl flex items-center justify-center">
        <div className="card card-gradient max-w-2xl w-full p-8 md:p-10 shadow-2xl border border-border-color/60 animate-fadeIn">
          {success ? (
            <div className="text-center space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-success/20 flex items-center justify-center">
                <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="space-y-3">
                <h1 className="text-3xl font-bold text-foreground">Conta criada com sucesso!</h1>
                <p className="text-foreground/70">
                  Enviamos um email de confirmação. Verifique sua caixa de entrada e confirme sua conta para começar a usar a plataforma.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push("/auth/login")}
                  className="btn btn-primary"
                >
                  Ir para o login
                </button>
                <button
                  onClick={() => setSuccess(false)}
                  className="btn btn-outline"
                >
                  Voltar ao formulário
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold text-foreground">Crie sua conta gratuita</h1>
                <p className="text-foreground/70">
                  Compartilhe seu objetivo para personalizarmos sua experiência de estudos desde o primeiro acesso.
                </p>
              </div>

              {formError && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5" htmlFor="nome-completo">
                      Nome completo
                    </label>
                    <input
                      id="nome-completo"
                      type="text"
                      value={nomeCompleto}
                      onChange={(event) => setNomeCompleto(event.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-white dark:bg-gray-800 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Seu nome completo"
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground/80 mb-1.5" htmlFor="objetivo">
                      Objetivo principal
                    </label>
                    <input
                      id="objetivo"
                      type="text"
                      value={objetivo}
                      onChange={(event) => setObjetivo(event.target.value)}
                      required
                      className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-white dark:bg-gray-800 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ex: Atingir 900 pontos na redação"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-white dark:bg-gray-800 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground/80 mb-1.5" htmlFor="password">
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="w-full px-3 py-2.5 rounded-lg border border-border-color bg-white dark:bg-gray-800 text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Crie uma senha segura"
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-foreground/60 mt-1">
                    Sua senha deve ter pelo menos 6 caracteres.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn btn-primary text-base flex items-center justify-center gap-2 disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Criando conta...
                    </span>
                  ) : (
                    "Criar conta"
                  )}
                </button>
              </form>

              <div className="mt-6 relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border-color"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-card-bg px-3 text-foreground/60">ou continue com</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignUp}
                disabled={submitting}
                className="mt-6 w-full flex items-center justify-center gap-3 border border-border-color rounded-lg px-4 py-3 text-sm font-medium text-foreground bg-white dark:bg-gray-800 hover:bg-muted-bg transition-colors disabled:opacity-70"
              >
                <svg className="w-5 h-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.4h147.4c-6.4 34.9-25.7 64.4-54.7 84.2v69.8h88.4c51.7-47.6 80.4-117.8 80.4-199z" />
                  <path fill="#34a853" d="M272 544.3c73.7 0 135.6-24.3 180.8-65.9l-88.4-69.8c-24.4 16.3-55.7 25.8-92.4 25.8-71 0-131.1-47.9-152.7-112.2H28.6v70.6c45 89 137.9 151.5 243.4 151.5z" />
                  <path fill="#fbbc04" d="M119.3 321.9c-10.8-32.4-10.8-67.2 0-99.6V151.7H28.6c-39.2 78.4-39.2 165.1 0 243.5l90.7-70.8z" />
                  <path fill="#ea4335" d="M272 107.7c38.9-.6 76.2 13.8 104.7 40.3l78.1-78.1C407.4 24.5 345.5 0 272 0 166.5 0 73.6 62.5 28.6 151.7l90.7 70.6C140.9 155.6 201 107.7 272 107.7z" />
                </svg>
                Cadastre-se com Google
              </button>

              <p className="mt-8 text-center text-sm text-foreground/70">
                Já possui uma conta? {" "}
                <Link href="/auth/login" className="text-primary hover:underline font-medium">
                  Entre com suas credenciais
                </Link>
              </p>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
