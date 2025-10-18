"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import { signIn, signInWithGoogle } from "@/lib/auth";
import { useAuth } from "@/app/contexts/AuthContext";

const highlights = [
  {
    title: "Painel completo",
    description: "Veja notas de redação, acertos por disciplina e recomendações personalizadas.",
  },
  {
    title: "Histórico salvo",
    description: "Acompanhe evolução com simulados e redações salvos automaticamente.",
  },
  {
    title: "Novidades primeiro",
    description: "Receba alertas sobre prazos e mudanças do ENEM diretamente no painel.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/conta");
    }
  }, [loading, user, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    setSubmitting(true);

    try {
      await signIn(email, password);
      router.replace("/conta");
      router.refresh();
    } catch (error) {
      setFormError((error as Error)?.message ?? "Não foi possível entrar. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setFormError(null);
    setSubmitting(true);

    try {
      await signInWithGoogle();
    } catch (error) {
      setFormError((error as Error)?.message ?? "Erro ao autenticar com Google.");
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-page-gradient text-foreground">
      <Header />

      <main className="flex-grow">
        <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="hero-accent absolute inset-0 blur-3xl" aria-hidden />
          <div className="container relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.85fr_1fr]">
            <div className="space-y-8">
              <div className="hero-status shadow-glow w-fit text-sm">
                🔐 Acesso seguro às suas ferramentas
              </div>
              <div className="space-y-5">
                <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                  Bem-vindo de volta! Continue evoluindo com seus simulados e redações.
                </h1>
                <p className="max-w-lg text-lg text-foreground/75">
                  Faça login para desbloquear relatórios inteligentes, histórico de desempenho e recomendações orientadas para
                  notas altas no ENEM.
                </p>
              </div>
              <div className="space-y-4">
                {highlights.map((item) => (
                  <div key={item.title} className="surface-card border border-border-color/60 p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground">{item.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{item.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground/60">
                Novo por aqui?{" "}
                <Link href="/auth/register" className="text-primary font-semibold hover:underline">
                  Crie sua conta gratuita
                </Link>{" "}
                em menos de 2 minutos.
              </p>
            </div>

            <div className="surface-card h-fit space-y-6 p-6 shadow-xl md:p-8">
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold text-foreground">Entre com sua conta</h2>
                <p className="text-sm text-foreground/60">Conecte-se para acompanhar sua jornada rumo à aprovação.</p>
              </div>

              {formError && (
                <div className="rounded-2xl border border-danger/30 bg-danger-light/30 p-3 text-sm text-danger">{formError}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <label className="block text-sm font-semibold text-foreground/80">
                  Email
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                    className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </label>
                <label className="block text-sm font-semibold text-foreground/80">
                  Senha
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    required
                    minLength={6}
                    className="mt-2 w-full rounded-2xl border border-border-color/70 bg-card-bg/80 px-4 py-3 text-base text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    placeholder="Digite sua senha"
                    autoComplete="current-password"
                  />
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary w-full px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      Entrando...
                    </span>
                  ) : (
                    "Entrar com email e senha"
                  )}
                </button>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border-color/70" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card-bg/90 px-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/50">
                    ou continue com
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="btn-glass flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.4h147.4c-6.4 34.9-25.7 64.4-54.7 84.2v69.8h88.4c51.7-47.6 80.4-117.8 80.4-199z" />
                  <path fill="#34a853" d="M272 544.3c73.7 0 135.6-24.3 180.8-65.9l-88.4-69.8c-24.4 16.3-55.7 25.8-92.4 25.8-71 0-131.1-47.9-152.7-112.2H28.6v70.6c45 89 137.9 151.5 243.4 151.5z" />
                  <path fill="#fbbc04" d="M119.3 321.9c-10.8-32.4-10.8-67.2 0-99.6V151.7H28.6c-39.2 78.4-39.2 165.1 0 243.5l90.7-70.8z" />
                  <path fill="#ea4335" d="M272 107.7c38.9-.6 76.2 13.8 104.7 40.3l78.1-78.1C407.4 24.5 345.5 0 272 0 166.5 0 73.6 62.5 28.6 151.7l90.7 70.6C140.9 155.6 201 107.7 272 107.7z" />
                </svg>
                Entrar com Google
              </button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
