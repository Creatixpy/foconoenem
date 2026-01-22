"use client";

import { useState, FormEvent, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn, signInWithGoogle } from "@/lib/auth/service";
import { useAuth } from "@/lib/auth/AuthContext";
import Image from "next/image";

type LoginPageClientProps = {
  redirectTo: string;
};

export default function LoginPageClient({ redirectTo }: LoginPageClientProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const registerHref = `/auth/register?next=${encodeURIComponent(redirectTo)}`;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [loading, user, router, redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setFormError(null);
    setSubmitting(true);

    try {
      const result = await signIn({ email, password });
      if (!result.success) {
        setFormError(result.error?.message ?? "Não foi possível entrar. Tente novamente.");
        return;
      }
      router.replace(redirectTo);
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
      const result = await signInWithGoogle({ redirectTo });
      if (!result.success) {
        setFormError(result.error?.message ?? "Erro ao autenticar com Google.");
        setSubmitting(false);
      }
    } catch (error) {
      setFormError((error as Error)?.message ?? "Erro ao autenticar com Google.");
      setSubmitting(false);
    }
  };

  if (loading) {
      return (
          <div className="flex min-h-screen items-center justify-center bg-background">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
      );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="flex flex-col items-center justify-center text-center">
            <Link href="/" className="mb-6 transition-transform hover:scale-105">
                <Image
                    src="/foconoenemicon.png"
                    alt="Foco no ENEM"
                    width={64}
                    height={64}
                    className="h-16 w-16"
                    priority
                />
            </Link>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
                Bem-vindo de volta
            </h2>
            <p className="mt-2 text-sm text-foreground/60">
                Continue sua jornada rumo à aprovação no ENEM.
            </p>
        </div>

        <div className="rounded-2xl border border-border-color bg-card-bg p-6 shadow-xl sm:p-8">
            {formError && (
                <div className="mb-6 rounded-lg border border-danger/20 bg-danger/10 p-4 text-sm font-medium text-danger animate-slide-down">
                    {formError}
                </div>
            )}

            <div className="space-y-6">
                <button
                    onClick={handleGoogleSignIn}
                    disabled={submitting}
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-border-color bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
                >
                    <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                        <path fill="#4285f4" d="M533.5 278.4c0-17.4-1.4-34.1-4-50.4H272v95.4h147.4c-6.4 34.9-25.7 64.4-54.7 84.2v69.8h88.4c51.7-47.6 80.4-117.8 80.4-199z" />
                        <path fill="#34a853" d="M272 544.3c73.7 0 135.6-24.3 180.8-65.9l-88.4-69.8c-24.4 16.3-55.7 25.8-92.4 25.8-71 0-131.1-47.9-152.7-112.2H28.6v70.6c45 89 137.9 151.5 243.4 151.5z" />
                        <path fill="#fbbc04" d="M119.3 321.9c-10.8-32.4-10.8-67.2 0-99.6V151.7H28.6c-39.2 78.4-39.2 165.1 0 243.5l90.7-70.8z" />
                        <path fill="#ea4335" d="M272 107.7c38.9-.6 76.2 13.8 104.7 40.3l78.1-78.1C407.4 24.5 345.5 0 272 0 166.5 0 73.6 62.5 28.6 151.7l90.7 70.6C140.9 155.6 201 107.7 272 107.7z" />
                    </svg>
                    Entrar com Google
                </button>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-color" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-card-bg px-2 text-foreground/50">ou continue com email</span>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-foreground/80">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="mt-2 block w-full rounded-xl border border-border-color bg-muted-bg/50 px-4 py-3 text-foreground shadow-sm transition-all placeholder:text-foreground/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="seu@email.com"
                        />
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm font-medium text-foreground/80">
                                Senha
                            </label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-xs font-medium text-primary hover:text-primary-dark"
                            >
                                Esqueceu a senha?
                            </Link>
                        </div>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="mt-2 block w-full rounded-xl border border-border-color bg-muted-bg/50 px-4 py-3 text-foreground shadow-sm transition-all placeholder:text-foreground/40 focus:border-primary focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Sua senha"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary-dark hover:shadow-primary/30 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        {submitting ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Entrando...
                            </div>
                        ) : (
                            "Entrar"
                        )}
                    </button>
                </form>
            </div>
        </div>

        <p className="text-center text-sm text-foreground/60">
            Ainda não tem uma conta?{" "}
            <Link
                href={registerHref}
                className="font-semibold text-primary transition-colors hover:text-primary-dark hover:underline"
            >
                Cadastre-se gratuitamente
            </Link>
        </p>
      </div>
    </main>
  );
}
