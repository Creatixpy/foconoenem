"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signUp, signInWithGoogle } from "@/lib/auth/service";
import { useAuth } from "@/lib/auth/AuthContext";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

type RegisterPageClientProps = {
  redirectTo: string;
};

const benefits = [
  {
    title: "Plano personalizado",
    description: "Monte metas baseadas no seu objetivo e receba lembretes para manter o foco.",
  },
  {
    title: "Correções ilimitadas",
    description: "Treine redações sem custo e acompanhe seu histórico em um só lugar.",
  },
  {
    title: "Insights acionáveis",
    description: "Veja recomendações claras para melhorar nota por competência.",
  },
];

export default function RegisterPageClient({ redirectTo }: RegisterPageClientProps) {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [nomeCompleto, setNomeCompleto] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  useEffect(() => {
    if (!success) {
      return;
    }

    let active = true;

    const redirectToDashboard = () => {
      if (!active) return;
      setRedirecting(true);
      router.replace(redirectTo);
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        redirectToDashboard();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        redirectToDashboard();
      }
    });

    return () => {
      active = false;
      listener?.subscription.unsubscribe();
    };
  }, [success, router, redirectTo]);

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
      const result = await signUp({
        email: email.trim(),
        password,
        nomeCompleto: nomeCompleto.trim(),
        objetivo: objetivo.trim(),
      });
      if (!result.success) {
        setFormError(result.error?.message ?? "Não foi possível criar a conta. Tente novamente.");
        return;
      }
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
      const result = await signInWithGoogle({
        nomeCompleto: nomeCompleto.trim(),
        objetivo: objetivo.trim(),
        redirectTo,
      });
      if (!result.success) {
        setFormError(result.error?.message ?? "Erro ao autenticar com Google.");
        setSubmitting(false);
      }
    } catch (error) {
      setFormError((error as Error)?.message ?? "Erro ao autenticar com Google.");
      setSubmitting(false);
    }
  };

  return (
    <main className="flex-grow">
      <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="container relative z-10 mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1fr]">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border-0 bg-secondary/50 px-3 py-1 text-sm font-medium text-foreground/80">
                🚀 Comece gratuitamente
              </div>
              <div className="space-y-5">
                <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                  Crie sua conta e transforme estudo em resultado no ENEM.
                </h1>
                <p className="max-w-lg text-lg text-foreground/60">
                  Tenha acesso a correções ilimitadas, simulados personalizados e um painel inteligente que mostra exatamente onde
                  focar sua energia.
                </p>
              </div>
              <div className="space-y-4">
                {benefits.map((benefit) => (
                  <div key={benefit.title} className="rounded-2xl border-0 bg-card-bg p-4 shadow-sm">
                    <h3 className="text-sm font-semibold text-foreground">{benefit.title}</h3>
                    <p className="mt-1 text-sm text-foreground/60">{benefit.description}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-foreground/80">
                Já possui uma conta?{" "}
                <Link
                  href={`/auth/login?next=${encodeURIComponent(redirectTo)}`}
                  className="text-primary font-semibold hover:underline"
                >
                  Entre por aqui
                </Link>
                .
              </p>
            </div>

            <div className="h-fit space-y-6 rounded-2xl border-0 bg-card-bg p-6 shadow-sm md:p-8">
              {success ? (
                <div className="space-y-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/20">
                    <svg className="h-10 w-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-2xl font-semibold text-foreground">Conta criada com sucesso!</h2>
                    <p className="text-sm text-foreground/60">
                      {redirecting
                        ? "Conta confirmada! Redirecionando você para a área do aluno..."
                        : "Enviamos um email de confirmação. Assim que você confirmar, vamos liberar o acesso automaticamente."}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3">
                    <button
                      onClick={() => router.push(`/auth/login?next=${encodeURIComponent(redirectTo)}`)}
                      className="btn btn-primary px-5 py-3 text-sm"
                    >
                      Ir para o login
                    </button>
                    <button
                      onClick={() => {
                        setSuccess(false);
                        setRedirecting(false);
                      }}
                      className="btn btn-outline px-5 py-3 text-sm"
                    >
                      Voltar ao formulário
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2 text-center">
                    <h2 className="text-2xl font-semibold text-foreground">Crie sua conta gratuita</h2>
                    <p className="text-sm text-foreground/60">Conte seu objetivo para personalizarmos sua experiência desde o início.</p>
                  </div>

                  {formError && (
                    <div className="rounded-2xl border border-danger/30 bg-danger-light/30 p-3 text-sm text-danger">{formError}</div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block text-sm font-semibold text-foreground/80">
                        Nome completo
                        <input
                          id="nome-completo"
                          type="text"
                          value={nomeCompleto}
                          onChange={(event) => setNomeCompleto(event.target.value)}
                          required
                          className="mt-2 w-full rounded-2xl border-0 bg-muted-bg/50 px-4 py-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Seu nome completo"
                          autoComplete="name"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-foreground/80">
                        Objetivo principal
                        <input
                          id="objetivo"
                          type="text"
                          value={objetivo}
                          onChange={(event) => setObjetivo(event.target.value)}
                          required
                          className="mt-2 w-full rounded-2xl border-0 bg-muted-bg/50 px-4 py-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                          placeholder="Ex.: atingir 900 pontos na redação"
                        />
                      </label>
                    </div>

                    <label className="block text-sm font-semibold text-foreground/80">
                      Email
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        required
                        className="mt-2 w-full rounded-2xl border-0 bg-muted-bg/50 px-4 py-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                        className="mt-2 w-full rounded-2xl border-0 bg-muted-bg/50 px-4 py-3 text-base text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Crie uma senha segura"
                        autoComplete="new-password"
                      />
                      <span className="mt-1 block text-xs text-foreground/60">Use pelo menos 6 caracteres.</span>
                    </label>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="btn btn-primary w-full px-6 py-3 text-base disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                          Criando sua conta...
                        </span>
                      ) : (
                        "Criar conta com email"
                      )}
                    </button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border-color" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-card-bg px-3 text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
                        ou continue com
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignUp}
                    disabled={submitting}
                    className="btn btn-outline flex w-full items-center justify-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-foreground transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                      <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.4h147.4c-6.4 34.9-25.7 64.4-54.7 84.2v69.8h88.4c51.7-47.6 80.4-117.8 80.4-199z" />
                      <path fill="#34a853" d="M272 544.3c73.7 0 135.6-24.3 180.8-65.9l-88.4-69.8c-24.4 16.3-55.7 25.8-92.4 25.8-71 0-131.1-47.9-152.7-112.2H28.6v70.6c45 89 137.9 151.5 243.4 151.5z" />
                      <path fill="#fbbc04" d="M119.3 321.9c-10.8-32.4-10.8-67.2 0-99.6V151.7H28.6c-39.2 78.4-39.2 165.1 0 243.5l90.7-70.8z" />
                      <path fill="#ea4335" d="M272 107.7c38.9-.6 76.2 13.8 104.7 40.3l78.1-78.1C407.4 24.5 345.5 0 272 0 166.5 0 73.6 62.5 28.6 151.7l90.7 70.6C140.9 155.6 201 107.7 272 107.7z" />
                    </svg>
                    Continuar com Google
                  </button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>
  );
}
