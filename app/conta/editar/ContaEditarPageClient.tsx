'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { updateUserProfile } from '@/lib/auth/profile-service';

/* ================================================================== */
/*  Icons                                                              */
/* ================================================================== */

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/* ================================================================== */
/*  Options                                                            */
/* ================================================================== */

const OBJETIVO_OPTIONS = [
  { value: '', label: 'Selecione seu objetivo' },
  { value: 'Passar no ENEM', label: 'Passar no ENEM' },
  { value: 'Medicina', label: 'Medicina' },
  { value: 'Engenharia', label: 'Engenharia' },
  { value: 'Direito', label: 'Direito' },
  { value: 'Outro', label: 'Outro' },
];

function getAnoOptions(): { value: string; label: string }[] {
  const currentYear = new Date().getFullYear();
  return [
    { value: '', label: 'Selecione o ano' },
    ...Array.from({ length: 4 }, (_, i) => {
      const year = currentYear + i;
      return { value: String(year), label: String(year) };
    }),
  ];
}

/* ================================================================== */
/*  Toast                                                              */
/* ================================================================== */

function SuccessToast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`
        fixed bottom-6 right-6 z-50
        flex items-center gap-2.5 px-5 py-3 rounded-xl
        bg-[var(--success)] text-white text-sm font-medium
        shadow-lg transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}
      `}
    >
      <CheckIcon /> {message}
    </div>
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export default function ContaEditarPageClient() {
  const router = useRouter();
  const { user, profile, initialized, loading: authLoading, refreshProfile } = useAuth();

  const [nome, setNome] = useState('');
  const [bio, setBio] = useState('');
  const [objetivo, setObjetivo] = useState('');
  const [anoEnem, setAnoEnem] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Auth guard
  useEffect(() => {
    if (initialized && !user) {
      router.replace('/login');
    }
  }, [initialized, user, router]);

  // Populate form from profile
  useEffect(() => {
    if (profile) {
      setNome(profile.nome_completo ?? '');
      setBio(profile.bio ?? '');
      setObjetivo(profile.objetivo ?? '');
      setAnoEnem(profile.ano_enem ? String(profile.ano_enem) : '');
    }
  }, [profile]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!user) return;

    setError('');
    setSaving(true);

    try {
      await updateUserProfile(user.id, {
        nome_completo: nome || null,
        bio: bio || null,
        objetivo: objetivo || null,
        ano_enem: anoEnem ? parseInt(anoEnem, 10) : null,
      });

      await refreshProfile();

      // Show success toast
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch {
      setError('Erro ao salvar perfil. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  // Loading state
  if (!initialized || authLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-48 rounded bg-[var(--surface-2)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-2)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-2)]" />
          <div className="h-24 w-full rounded-xl bg-[var(--surface-2)]" />
          <div className="h-12 w-full rounded-xl bg-[var(--surface-2)]" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      {/* Back link */}
      <Link
        href="/conta"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--text-3)] hover:text-[var(--text-2)] transition-colors mb-8"
      >
        <ArrowLeftIcon /> Voltar para o painel
      </Link>

      {/* Header */}
      <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">
        Editar Perfil
      </h1>
      <p className="mt-2 text-sm text-[var(--text-3)]">
        Atualize suas informações pessoais
      </p>

      {/* Error */}
      {error && (
        <div className="mt-6 px-4 py-3 rounded-xl text-sm bg-[var(--danger-soft)] text-[var(--danger)] border border-[var(--danger)]/20">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        {/* Nome completo */}
        <div>
          <label htmlFor="edit-nome" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Nome completo
          </label>
          <input
            id="edit-nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Seu nome"
            className="
              w-full px-4 py-3 rounded-xl text-sm
              bg-[var(--surface)] border border-[var(--border)]
              text-[var(--text)] placeholder:text-[var(--text-3)]
              focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
              transition-all duration-[var(--duration-fast)]
            "
          />
        </div>

        {/* Bio */}
        <div>
          <label htmlFor="edit-bio" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Bio
          </label>
          <textarea
            id="edit-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre você..."
            rows={3}
            maxLength={300}
            className="
              w-full px-4 py-3 rounded-xl text-sm resize-none
              bg-[var(--surface)] border border-[var(--border)]
              text-[var(--text)] placeholder:text-[var(--text-3)]
              focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
              transition-all duration-[var(--duration-fast)]
            "
          />
          <p className="mt-1 text-xs text-[var(--text-3)] text-right">{bio.length}/300</p>
        </div>

        {/* Objetivo */}
        <div>
          <label htmlFor="edit-objetivo" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Objetivo
          </label>
          <select
            id="edit-objetivo"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
            className="
              w-full px-4 py-3 rounded-xl text-sm appearance-none
              bg-[var(--surface)] border border-[var(--border)]
              text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
              transition-all duration-[var(--duration-fast)]
            "
          >
            {OBJETIVO_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Ano do ENEM */}
        <div>
          <label htmlFor="edit-ano" className="block text-sm font-medium text-[var(--text-2)] mb-1.5">
            Ano do ENEM
          </label>
          <select
            id="edit-ano"
            value={anoEnem}
            onChange={(e) => setAnoEnem(e.target.value)}
            className="
              w-full px-4 py-3 rounded-xl text-sm appearance-none
              bg-[var(--surface)] border border-[var(--border)]
              text-[var(--text)]
              focus:outline-none focus:ring-2 focus:ring-[var(--ring)] focus:border-transparent
              transition-all duration-[var(--duration-fast)]
            "
          >
            {getAnoOptions().map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3 rounded-xl text-sm font-semibold
              bg-[var(--brand)] text-white
              hover:bg-[var(--brand-hover)] active:bg-[var(--brand-active)]
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-[var(--duration-fast)]
              shadow-sm
            "
          >
            {saving ? <SpinnerIcon /> : null}
            Salvar alterações
          </button>
          <Link
            href="/conta"
            className="
              px-6 py-3 rounded-xl text-sm font-medium
              text-[var(--text-2)]
              hover:bg-[var(--surface-2)] transition-colors
            "
          >
            Cancelar
          </Link>
        </div>
      </form>

      {/* Success toast */}
      <SuccessToast message="Perfil atualizado com sucesso!" visible={showToast} />
    </div>
  );
}
