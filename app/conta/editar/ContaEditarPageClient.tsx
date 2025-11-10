"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { updateUserProfile, UserProfile } from "@/lib/auth";

export default function ContaEditarPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [bio, setBio] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [anoEnem, setAnoEnem] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNomeCompleto(profile.nome_completo || '');
      setBio(profile.bio || '');
      setObjetivo(profile.objetivo || '');
      setAnoEnem(profile.ano_enem ? profile.ano_enem.toString() : '');
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await updateUserProfile(user.id, {
        nome_completo: nomeCompleto,
        bio: bio || null,
        objetivo: objetivo || null,
        ano_enem: anoEnem ? parseInt(anoEnem) : null,
      } as Partial<UserProfile>);

      await refreshProfile();
      setSuccess(true);
      
      setTimeout(() => {
        router.push('/conta');
      }, 1500);
    } catch (err) {
      setError((err as Error).message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/auth/login?next=${encodeURIComponent('/conta/editar')}`);
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
        <div className="loader" />
      </main>
    );
  }

  return (
    <main className="flex-grow bg-gradient-to-br from-background via-background to-muted-bg">
      <div className="container mx-auto max-w-3xl p-4 md:p-8">
        <div className="card card-gradient p-6 md:p-8 animate-fadeIn">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.back()}
              className="mr-4 text-foreground opacity-70 hover:opacity-100 transition-opacity"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Editar Perfil
            </h1>
          </div>

          {success && (
            <div className="bg-success-light border border-success text-success p-4 rounded-lg mb-6 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Perfil atualizado com sucesso! Redirecionando...
            </div>
          )}

          {error && (
            <div className="bg-danger-light border border-danger text-danger p-4 rounded-lg mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={nomeCompleto}
                onChange={(e) => setNomeCompleto(e.target.value)}
                required
                className="w-full"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full"
                rows={3}
                placeholder="Conte um pouco sobre você..."
              />
              <p className="text-xs text-foreground opacity-60 mt-1">
                Opcional - Uma breve descrição sobre você
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Objetivo
              </label>
              <input
                type="text"
                value={objetivo}
                onChange={(e) => setObjetivo(e.target.value)}
                className="w-full"
                placeholder="Ex: Passar em Medicina na USP"
              />
              <p className="text-xs text-foreground opacity-60 mt-1">
                Opcional - Qual seu objetivo com o ENEM?
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Ano do ENEM
              </label>
              <input
                type="number"
                value={anoEnem}
                onChange={(e) => setAnoEnem(e.target.value)}
                className="w-full"
                placeholder="2025"
                min="2024"
                max="2030"
              />
              <p className="text-xs text-foreground opacity-60 mt-1">
                Opcional - Em que ano você pretende fazer o ENEM?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary flex-1"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <div className="loader-small mr-2"></div>
                    Salvando...
                  </span>
                ) : (
                  'Salvar Alterações'
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="btn btn-secondary flex-1"
                disabled={loading}
              >
                Cancelar
              </button>
            </div>
          </form>

          <div className="mt-8 pt-8 border-t border-border-color">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Informações da Conta
            </h3>
            <div className="space-y-2 text-sm text-foreground opacity-70">
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Cadastrado em:</strong> {new Date(user.created_at!).toLocaleDateString('pt-BR')}</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
