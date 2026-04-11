'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '@/lib/auth/context';
import { confirmCommunityAge, acceptCommunityTerms, updateCommunitySettings } from '@/lib/auth/community-service';
import { getUserAchievements } from '@/lib/auth/achievements-service';
import { useCommunityTopics, type Topic } from './hooks/useCommunityTopics';
import { useCommunityThreads, type Thread, type AuthorProfile } from './hooks/useCommunityThreads';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Achievement {
  id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: {
    name: string;
    description: string | null;
    icon: string | null;
    slug: string;
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  return `${Math.floor(days / 30)}m`;
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#EF4444', '#06B6D4', '#6366F1',
];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Age verification gate */
function AgeGate({ onConfirm, loading }: { onConfirm: () => void; loading: boolean }) {
  const [checked, setChecked] = useState(false);
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Confirme sua idade</h2>
          <p className="text-sm text-[var(--text-muted)]">
            Para garantir um ambiente seguro, precisamos confirmar que você tem pelo menos 16 anos.
          </p>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border-color)] accent-[var(--primary)]"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            Confirmo que tenho 16 anos ou mais
          </span>
        </label>
        <button
          onClick={onConfirm}
          disabled={!checked || loading}
          className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Confirmando...' : 'Confirmar e continuar'}
        </button>
      </div>
    </motion.div>
  );
}

/** Terms acceptance gate */
function TermsGate({ onAccept, loading }: { onAccept: () => void; loading: boolean }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]/80 backdrop-blur-sm p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-md rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-6 space-y-5">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">Termos da comunidade</h2>
        </div>
        <div className="max-h-48 overflow-y-auto text-sm text-[var(--text-secondary)] leading-relaxed space-y-2 p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
          <p><strong>Respeito mútuo:</strong> Trate todos com respeito. Bullying, assédio e discriminação não são tolerados.</p>
          <p><strong>Conteúdo educativo:</strong> A comunidade é focada em estudo. Posts fora do tema podem ser removidos.</p>
          <p><strong>Sem spam:</strong> Não publique links irrelevantes, propaganda ou conteúdo repetitivo.</p>
          <p><strong>Privacidade:</strong> Não compartilhe dados pessoais de outros membros.</p>
          <p><strong>Moderação:</strong> Posts e comentários podem ser moderados para manter a qualidade.</p>
        </div>
        <button
          onClick={onAccept}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[var(--primary)] text-white font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? 'Aceitando...' : 'Li e aceito os termos'}
        </button>
      </div>
    </motion.div>
  );
}

/** Post card */
function PostCard({
  thread,
  profile,
  profiles,
  liked,
  likeCount,
  userId,
  onToggleLike,
  onComment,
  onDelete,
  onDeleteComment,
}: {
  thread: Thread;
  profile?: AuthorProfile;
  profiles: Record<string, AuthorProfile>;
  liked: boolean;
  likeCount: number;
  userId: string | null;
  onToggleLike: () => void;
  onComment: (content: string) => Promise<void>;
  onDelete: () => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmitComment = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onComment(commentText.trim());
      setCommentText('');
    } catch { /* ignore */ }
    setSubmitting(false);
  };

  const authorName = profile?.nome_completo || 'Anônimo';
  const visibleComments = thread.comments.filter((c) => c.status === 'visible');

  return (
    <motion.div
      className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] overflow-hidden"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
    >
      <div className="p-4 sm:p-5">
        {/* author row */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: avatarColor(thread.user_id) }}
          >
            {getInitials(authorName)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--text-primary)] truncate">{authorName}</p>
            <p className="text-xs text-[var(--text-muted)]">{timeAgo(thread.created_at)}</p>
          </div>
          {userId === thread.user_id && (
            <button
              onClick={onDelete}
              className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer"
              title="Excluir post"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </button>
          )}
        </div>

        {/* post content */}
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1.5">{thread.title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed whitespace-pre-line line-clamp-6">
          {thread.content}
        </p>

        {/* actions bar */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[var(--border-color)]">
          <button
            onClick={onToggleLike}
            className={`flex items-center gap-1.5 text-sm transition-colors cursor-pointer ${
              liked ? 'text-[var(--danger)]' : 'text-[var(--text-muted)] hover:text-[var(--danger)]'
            }`}
          >
            <svg
              className="w-4 h-4"
              fill={liked ? 'currentColor' : 'none'}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
            {visibleComments.length > 0 && <span>{visibleComments.length}</span>}
          </button>
        </div>
      </div>

      {/* comments section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            className="border-t border-[var(--border-color)] bg-[var(--bg-surface)]"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-3">
              {visibleComments.map((c) => {
                const commentAuthor = profiles[c.user_id];
                const commentName = commentAuthor?.nome_completo || 'Estudante';
                const commentInitials = commentName
                  .split(' ')
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0])
                  .join('')
                  .toUpperCase();
                return (
                <div key={c.id} className="flex items-start gap-2">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: avatarColor(c.user_id) }}
                  >
                    {commentInitials || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-[var(--text-primary)]">{commentName}</span>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{c.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-[var(--text-muted)]">{timeAgo(c.created_at)}</span>
                      {userId === c.user_id && (
                        <button
                          onClick={() => onDeleteComment(c.id)}
                          className="text-xs text-[var(--text-muted)] hover:text-[var(--danger)] cursor-pointer"
                        >
                          excluir
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                );
              })}

              {/* comment input */}
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva um comentário..."
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring-color)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <button
                  onClick={handleSubmitComment}
                  disabled={!commentText.trim() || submitting}
                  className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {submitting ? '...' : 'Enviar'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function CommunityPageClient() {
  const router = useRouter();
  const { user, profile, loading: authLoading, initialized, refreshProfile } = useAuth();

  // Gates
  const [gateLoading, setGateLoading] = useState(false);

  // Topics
  const { topics, loading: topicsLoading } = useCommunityTopics();
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Threads
  const {
    threads, profiles, likedPosts, likeCounts,
    loading: threadsLoading, refetch,
    createPost, createComment, toggleLike, deletePost, deleteComment,
  } = useCommunityThreads(selectedTopic?.id ?? null, user?.id ?? null);

  // New post form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postSubmitting, setPostSubmitting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Mobile tab
  const [mobileTab, setMobileTab] = useState<'feed' | 'topics' | 'profile'>('feed');

  // Sidebar settings
  const [tagline, setTagline] = useState('');
  const [showStats, setShowStats] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Rules expanded
  const [rulesExpanded, setRulesExpanded] = useState(false);

  // Auth guard
  useEffect(() => {
    if (initialized && !authLoading && !user) {
      router.replace('/login');
    }
  }, [initialized, authLoading, user, router]);

  // Select first topic when loaded
  useEffect(() => {
    if (topics.length > 0 && !selectedTopic) {
      setSelectedTopic(topics[0]);
    }
  }, [topics, selectedTopic]);

  // Load profile settings
  useEffect(() => {
    if (profile) {
      setTagline(profile.community_tagline || '');
      setShowStats(profile.community_show_statistics ?? false);
    }
  }, [profile]);

  // Load achievements
  useEffect(() => {
    if (user?.id) {
      getUserAchievements(user.id).then((data) => {
        setAchievements(data as Achievement[]);
      }).catch(() => {});
    }
  }, [user?.id]);

  // Gate handlers
  const handleAgeConfirm = async () => {
    if (!user?.id) return;
    setGateLoading(true);
    try {
      await confirmCommunityAge(user.id);
      await refreshProfile();
    } catch { /* ignore */ }
    setGateLoading(false);
  };

  const handleTermsAccept = async () => {
    if (!user?.id) return;
    setGateLoading(true);
    try {
      await acceptCommunityTerms(user.id);
      await refreshProfile();
    } catch { /* ignore */ }
    setGateLoading(false);
  };

  // Post handler
  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim() || postSubmitting) return;
    setPostSubmitting(true);
    setPostError(null);
    try {
      await createPost(postTitle.trim(), postContent.trim());
      setPostTitle('');
      setPostContent('');
    } catch (err) {
      setPostError(err instanceof Error ? err.message : 'Erro ao publicar');
    }
    setPostSubmitting(false);
  };

  // Settings handler
  const handleSaveSettings = async () => {
    if (!user?.id || settingsSaving) return;
    setSettingsSaving(true);
    setSettingsSaved(false);
    try {
      await updateCommunitySettings(user.id, {
        community_tagline: tagline || null,
        community_show_statistics: showStats,
      });
      await refreshProfile();
      setSettingsSaved(true);
      setTimeout(() => setSettingsSaved(false), 2000);
    } catch { /* ignore */ }
    setSettingsSaving(false);
  };

  // -------------------------------------------------------------------------
  // Render guards
  // -------------------------------------------------------------------------
  if (authLoading || !initialized) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse space-y-6">
        <div className="h-8 w-48 rounded bg-[var(--bg-surface)]" />
        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr_280px] gap-6">
          <div className="space-y-3 hidden md:block">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-[var(--bg-surface)]" />
            ))}
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl bg-[var(--bg-surface)]" />
            ))}
          </div>
          <div className="hidden md:block h-64 rounded-xl bg-[var(--bg-surface)]" />
        </div>
      </div>
    );
  }
  if (!user || !profile) return null;

  // Gate checks
  const needsAgeGate = !profile.is_over_16;
  const needsTermsGate = !needsAgeGate && !profile.community_terms_accepted_at;

  // -------------------------------------------------------------------------
  // Left sidebar content
  // -------------------------------------------------------------------------
  const sidebarContent = (
    <div className="space-y-6">
      {/* Topics list */}
      <div>
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Tópicos</h3>
        <div className="space-y-1">
          {topicsLoading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-9 rounded-lg bg-[var(--bg-surface)] animate-pulse" />
            ))
          ) : (
            topics.map((t) => (
              <button
                key={t.id}
                onClick={() => { setSelectedTopic(t); setMobileTab('feed'); }}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer ${
                  selectedTopic?.id === t.id
                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-surface)]'
                }`}
              >
                {t.title}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Rules */}
      <div>
        <button
          onClick={() => setRulesExpanded(!rulesExpanded)}
          className="flex items-center justify-between w-full text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider cursor-pointer"
        >
          Regras rápidas
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${rulesExpanded ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
        {rulesExpanded && (
          <ul className="mt-2 space-y-1.5 text-xs text-[var(--text-muted)] leading-relaxed">
            <li>• Respeite todos os membros</li>
            <li>• Conteúdo focado em estudos</li>
            <li>• Sem spam ou propaganda</li>
            <li>• Não compartilhe dados pessoais</li>
            <li>• Posts podem ser moderados</li>
          </ul>
        )}
      </div>

      {/* Profile settings */}
      <div>
        <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Perfil social</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-[var(--text-muted)] mb-1 block">Bio / frase</label>
            <textarea
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              rows={2}
              maxLength={120}
              placeholder="Sua frase curta..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring-color)] resize-none"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showStats}
              onChange={(e) => setShowStats(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--border-color)] accent-[var(--primary)]"
            />
            <span className="text-xs text-[var(--text-secondary)]">Exibir estatísticas publicamente</span>
          </label>
          <button
            onClick={handleSaveSettings}
            disabled={settingsSaving}
            className="w-full py-2 rounded-lg text-xs font-medium border border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface)] transition-colors disabled:opacity-50 cursor-pointer"
          >
            {settingsSaved ? '✓ Salvo' : settingsSaving ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Right panel content
  // -------------------------------------------------------------------------
  const rightPanelContent = (
    <div className="space-y-6">
      {/* Achievements card */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-[var(--warning)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.003 6.003 0 01-4.27 1.772 6.003 6.003 0 01-4.27-1.772" />
          </svg>
          Suas conquistas
        </h3>
        {achievements.length === 0 ? (
          <p className="text-xs text-[var(--text-muted)]">
            Nenhuma conquista ainda. Continue estudando!
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {achievements.slice(0, 9).map((a) => (
              <div
                key={a.id}
                className="text-center p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]"
                title={a.achievement?.description || a.achievement?.name || ''}
              >
                <span className="text-xl">{a.achievement?.icon || '🏆'}</span>
                <p className="text-[10px] text-[var(--text-muted)] mt-1 truncate">
                  {a.achievement?.name || 'Conquista'}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 space-y-2">
        <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2">Links rápidos</h3>
        {[
          { href: '/redacao', label: 'Praticar redação', icon: '✍️' },
          { href: '/questoes', label: 'Fazer simulado', icon: '📝' },
          { href: '/conta', label: 'Ver meu perfil', icon: '👤' },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <span>{link.icon}</span>
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  // -------------------------------------------------------------------------
  // Main feed content
  // -------------------------------------------------------------------------
  const feedContent = (
    <div className="space-y-5">
      {/* topic header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            {selectedTopic?.title || 'Comunidade'}
          </h2>
          {selectedTopic?.description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{selectedTopic.description}</p>
          )}
        </div>
        <button
          onClick={refetch}
          className="text-xs text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors cursor-pointer flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
          </svg>
          Atualizar
        </button>
      </div>

      {/* new post form */}
      <div className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] p-4 space-y-3">
        <input
          type="text"
          value={postTitle}
          onChange={(e) => setPostTitle(e.target.value)}
          placeholder="Título do post"
          maxLength={200}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring-color)]"
        />
        <textarea
          value={postContent}
          onChange={(e) => setPostContent(e.target.value)}
          placeholder="Compartilhe algo com a comunidade..."
          rows={3}
          className="w-full text-sm px-3 py-2.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--ring-color)] resize-none"
        />
        {postError && (
          <p className="text-xs text-[var(--danger)]">{postError}</p>
        )}
        <div className="flex items-center justify-between">
          <p className="text-xs text-[var(--text-muted)]">
            Posts são revisados pela moderação
          </p>
          <button
            onClick={handleCreatePost}
            disabled={!postTitle.trim() || !postContent.trim() || postSubmitting}
            className="px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-sm font-medium hover:bg-[var(--primary-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {postSubmitting ? 'Publicando...' : 'Publicar'}
          </button>
        </div>
      </div>

      {/* threads list */}
      {threadsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-[var(--bg-surface)] animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-surface)] flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
          </div>
          <p className="text-[var(--text-muted)] text-sm">Nenhum post neste tópico ainda.</p>
          <p className="text-[var(--text-muted)] text-xs mt-1">Seja o primeiro a compartilhar!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {threads.filter((t) => t.status === 'published').map((thread) => (
            <PostCard
              key={thread.id}
              thread={thread}
              profile={profiles[thread.user_id]}
              profiles={profiles}
              liked={likedPosts.has(thread.id)}
              likeCount={likeCounts[thread.id] ?? 0}
              userId={user?.id ?? null}
              onToggleLike={() => toggleLike(thread.id)}
              onComment={(content) => createComment(thread.id, content)}
              onDelete={() => deletePost(thread.id)}
              onDeleteComment={(commentId) => deleteComment(commentId)}
            />
          ))}
        </div>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-[80vh] pb-20">
      {/* Gates */}
      {needsAgeGate && <AgeGate onConfirm={handleAgeConfirm} loading={gateLoading} />}
      {needsTermsGate && <TermsGate onAccept={handleTermsAccept} loading={gateLoading} />}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* page header */}
        <motion.div
          className="mb-6 space-y-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface)] text-xs text-[var(--text-muted)]">
            <span className="text-[var(--primary)]">✦</span>
            Comunidade
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)]">
            Comunidade de estudantes
          </h1>
          <p className="text-[var(--text-muted)] text-sm">
            Troque conhecimento, tire dúvidas e motive outros estudantes.
          </p>
        </motion.div>

        {/* mobile tab bar */}
        <div className="flex md:hidden gap-1 mb-5 p-1 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-color)]">
          {([
            { id: 'feed' as const, label: 'Feed' },
            { id: 'topics' as const, label: 'Tópicos' },
            { id: 'profile' as const, label: 'Perfil' },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setMobileTab(tab.id)}
              className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                mobileTab === tab.id
                  ? 'bg-[var(--primary)] text-white'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* desktop 3-column layout */}
        <div className="hidden md:grid md:grid-cols-[250px_1fr_280px] gap-6">
          {/* left sidebar */}
          <aside className="sticky top-24 self-start">{sidebarContent}</aside>
          {/* main feed */}
          <main>{feedContent}</main>
          {/* right panel */}
          <aside className="sticky top-24 self-start">{rightPanelContent}</aside>
        </div>

        {/* mobile single column */}
        <div className="md:hidden">
          {mobileTab === 'feed' && feedContent}
          {mobileTab === 'topics' && sidebarContent}
          {mobileTab === 'profile' && rightPanelContent}
        </div>
      </div>
    </div>
  );
}
