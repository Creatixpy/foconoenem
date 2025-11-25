"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { COMMUNITY_TERMS_VERSION } from "@/lib/auth/constants";
import {
  acceptCommunityTerms,
  confirmCommunityAge,
  getUserAchievements,
  getUserStatistics,
  updateCommunitySettings,
} from "@/lib/auth/service";
import type { UserAchievement, UserStatistics } from "@/lib/auth/types";
import { getBrowserClient } from "@/lib/db";
import { useAuth } from "@/lib/auth/AuthContext";
import {
  useCommunityThreads,
  type CommunityComment,
  type CommunityPost,
  type CommunityThread,
} from "./hooks/useCommunityThreads";
import { useCommunityTopics } from "./hooks/useCommunityTopics";

type ProfilePreview = {
  user_id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  community_tagline: string | null;
  community_show_statistics: boolean | null;
};

type AwardResponse = {
  achievements: UserAchievement[];
  unlocked: string[];
};

const RELATIVE_TIME_DIVISIONS: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
  { amount: 60, unit: "second" },
  { amount: 60, unit: "minute" },
  { amount: 24, unit: "hour" },
  { amount: 7, unit: "day" },
  { amount: 4.34524, unit: "week" },
  { amount: 12, unit: "month" },
  { amount: Infinity, unit: "year" },
];

const relativeFormatter = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

const formatRelativeTime = (value: string) => {
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) {
    return "agora mesmo";
  }

  let duration = (timestamp - Date.now()) / 1000;
  for (const division of RELATIVE_TIME_DIVISIONS) {
    if (Math.abs(duration) < division.amount) {
      return relativeFormatter.format(Math.round(duration), division.unit);
    }
    duration /= division.amount;
  }

  return "agora mesmo";
};

const communityGuidelines = [
  "Compartilhe repertórios e dúvidas sem spoilers de provas.",
  "Evite plágio: cite fontes quando possível.",
  "Seja respeitoso e denuncie conteúdos fora do tema educação.",
  "Links externos só quando forem úteis e verificados.",
];

const COMMUNITY_TERMS_SUMMARY =
  "O código de conduta exige que cada participante confirme ter 16 anos ou mais, respeite a LGPD, evite autopromoção ou discurso de ódio e aceita que conteúdos fora de educação sejam removidos automaticamente.";

const COMMUNITY_BADGE_ORDER = ["nota_mil", "primeira_redacao", "maratona_questoes", "mentor_comunitario"];

const COMMUNITY_TERMS_LINKS = [
  { href: "/termos", label: "Termos de uso" },
  { href: "/privacidade", label: "Política de privacidade" },
];

const COMMUNITY_POLICY_VERSION_LABEL = "2024.07 · Comunidade Foco no ENEM";

const renderBadges = (badges?: UserAchievement[]) => {
  if (!badges || badges.length === 0) {
    return null;
  }

  const ordered = [...badges].sort((a, b) => {
    const slugA = a.achievement?.slug ?? "";
    const slugB = b.achievement?.slug ?? "";
    const indexA = COMMUNITY_BADGE_ORDER.indexOf(slugA);
    const indexB = COMMUNITY_BADGE_ORDER.indexOf(slugB);
    return (indexB >= 0 ? indexB : Infinity) - (indexA >= 0 ? indexA : Infinity);
  });

  return (
    <div className="mt-2 flex flex-wrap gap-2" aria-label="Medalhas conquistadas">
      {ordered.map((badge) => (
        <span
          key={badge.id}
          className="inline-flex items-center gap-2 rounded-full border border-border-color/50 bg-muted-bg/40 px-3 py-1 text-xs font-semibold text-foreground/80"
        >
          <span role="img" aria-hidden="true">
            {badge.achievement?.icon ?? "🎖️"}
          </span>
          {badge.achievement?.name}
        </span>
      ))}
    </div>
  );
};

export default function CommunityPageClient() {
  const { user, profile, loading: authLoading, refreshProfile } = useAuth();
  const { topics, loading: topicsLoading, error: topicsError, reload: reloadTopics } = useCommunityTopics();
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [profileCache, setProfileCache] = useState<Record<string, ProfilePreview>>({});
  const [achievementCache, setAchievementCache] = useState<Record<string, UserAchievement[]>>({});

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [creatingPost, setCreatingPost] = useState(false);

  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentLoading, setCommentLoading] = useState<Record<string, boolean>>({});
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [commentDeleting, setCommentDeleting] = useState<Record<string, boolean>>({});
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const [userBadges, setUserBadges] = useState<UserAchievement[]>([]);

  const [taglineDraft, setTaglineDraft] = useState("");
  const [showStatsToggle, setShowStatsToggle] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);

  const [ageCheckbox, setAgeCheckbox] = useState(false);
  const [termsCheckbox, setTermsCheckbox] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  const {
    threads,
    setThreads,
    loading: threadsLoading,
    error: threadsError,
    reload: reloadThreads,
    postLikes,
    setPostLikes,
    commentCount,
    setCommentCount,
  } = useCommunityThreads(selectedTopicId, user?.id ?? null);
  const combinedPostsError = postsError ?? threadsError;

  const fetchJson = useCallback(async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const response = await fetch(input, { cache: "no-store", ...init });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        (payload && typeof payload === "object" && "error" in payload
          ? (payload.error as string | undefined)
          : undefined) ?? "Falha ao consultar os dados.";
      throw new Error(message);
    }
    return payload ?? {};
  }, []);

  const getAccessToken = useCallback(async () => {
    const supabase = getBrowserClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }, []);

  const fetchAuthorizedJson = useCallback(
    async (input: string, init: RequestInit = {}) => {
      const token = await getAccessToken();
      if (!token) {
        throw new Error("Sua sessão expirou. Faça login novamente.");
      }

      const headers = new Headers(init.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);
      if (init.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const response = await fetch(input, {
        cache: "no-store",
        ...init,
        headers,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message =
          (payload && typeof payload === "object" && "error" in payload
            ? (payload.error as string | undefined)
            : undefined) ?? "Falha ao processar a ação.";
        throw new Error(message);
      }

      return payload ?? {};
    },
    [getAccessToken]
  );

  useEffect(() => {
    if (!selectedTopicId && topics.length > 0) {
      setSelectedTopicId(topics[0].id);
    }
  }, [topics, selectedTopicId]);

  useEffect(() => {
    setTaglineDraft(profile?.community_tagline ?? "");
    setShowStatsToggle(profile?.community_show_statistics ?? true);
  }, [profile?.community_tagline, profile?.community_show_statistics]);

  useEffect(() => {
    if (!user || !profile) return;
    setProfileCache((previous) => ({
      ...previous,
      [user.id]: {
        user_id: user.id,
        nome_completo: profile.nome_completo,
        avatar_url: profile.avatar_url,
        community_tagline: profile.community_tagline,
        community_show_statistics: profile.community_show_statistics,
      },
    }));
  }, [profile, user]);
  useEffect(() => {
    if (!user) return;
    setAchievementCache((previous) => ({ ...previous, [user.id]: userBadges }));
  }, [user, userBadges]);

  const hydrateProfiles = useCallback(
    async (userIds: string[]) => {
      if (userIds.length === 0) return;
      try {
        const payload = await fetchJson("/api/comunidade/profiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        });

        const profiles = Array.isArray(payload.profiles) ? payload.profiles : [];

        setProfileCache((previous) => {
          const next = { ...previous };
          profiles.forEach((item: ProfilePreview) => {
            next[item.user_id] = item;
          });
          return next;
        });
      } catch (error) {
        console.error("Erro ao buscar perfis:", error);
      }
    },
    [fetchJson]
  );

  const hydrateAchievements = useCallback(
    async (userIds: string[]) => {
      if (userIds.length === 0) return;
      try {
        const payload = await fetchJson("/api/comunidade/achievements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds }),
        });

        const entries: UserAchievement[] = Array.isArray(payload.achievements)
          ? (payload.achievements as UserAchievement[])
          : [];

        const grouped = entries.reduce((accumulator, typedItem) => {
          const list = accumulator[typedItem.user_id] ?? [];
          list.push(typedItem);
          accumulator[typedItem.user_id] = list;
          return accumulator;
        }, {} as Record<string, UserAchievement[]>);

        setAchievementCache((previous) => ({ ...previous, ...grouped }));
      } catch (error) {
        console.error("Erro ao buscar badges:", error);
      }
    },
    [fetchJson]
  );

  const hydrateLikes = useCallback(
    async (postIds: string[]) => {
      if (postIds.length === 0) return;
      try {
        const payload = await fetchJson("/api/comunidade/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postIds }),
        });

        const entries = Array.isArray(payload.likes) ? payload.likes : [];

        const map: Record<string, { count: number; liked: boolean }> = {};
        entries.forEach((like: { post_id: string; user_id: string }) => {
          map[like.post_id] = map[like.post_id] ?? { count: 0, liked: false };
          map[like.post_id].count += 1;
          if (like.user_id === user?.id) {
            map[like.post_id].liked = true;
          }
        });

        postIds.forEach((id) => {
          if (!map[id]) {
            map[id] = { count: 0, liked: false };
          }
        });

        setPostLikes((previous) => ({ ...previous, ...map }));
      } catch (error) {
        console.error("Erro ao carregar curtidas:", error);
      }
    },
    [fetchJson, setPostLikes, user?.id]
  );

  // Track hydration state to prevent infinite loops
  const isHydratingRef = useRef(false);
  const hydratedProfilesRef = useRef<Set<string>>(new Set());
  const hydratedAchievementsRef = useRef<Set<string>>(new Set());
  const hydratedLikesRef = useRef<Set<string>>(new Set());

  // Hydrate missing data when threads change - with loop protection
  useEffect(() => {
    if (threads.length === 0 || isHydratingRef.current) {
      return;
    }

    const missingProfiles: string[] = [];
    const missingAchievements: string[] = [];
    const missingLikes: string[] = [];

    threads.forEach((thread) => {
      // Only hydrate profiles we haven't already requested
      if (!hydratedProfilesRef.current.has(thread.user_id) && !profileCache[thread.user_id]) {
        missingProfiles.push(thread.user_id);
        hydratedProfilesRef.current.add(thread.user_id);
      }
      if (!hydratedAchievementsRef.current.has(thread.user_id) && !achievementCache[thread.user_id]) {
        missingAchievements.push(thread.user_id);
        hydratedAchievementsRef.current.add(thread.user_id);
      }

      thread.comments.forEach((comment) => {
        if (!hydratedProfilesRef.current.has(comment.user_id) && !profileCache[comment.user_id]) {
          missingProfiles.push(comment.user_id);
          hydratedProfilesRef.current.add(comment.user_id);
        }
        if (!hydratedAchievementsRef.current.has(comment.user_id) && !achievementCache[comment.user_id]) {
          missingAchievements.push(comment.user_id);
          hydratedAchievementsRef.current.add(comment.user_id);
        }
      });

      if (!hydratedLikesRef.current.has(thread.id) && !postLikes[thread.id]) {
        missingLikes.push(thread.id);
        hydratedLikesRef.current.add(thread.id);
      }
    });

    // Only proceed if we have missing data to fetch
    if (missingProfiles.length === 0 && missingAchievements.length === 0 && missingLikes.length === 0) {
      return;
    }

    isHydratingRef.current = true;

    const hydrateAll = async () => {
      try {
        await Promise.all([
          missingProfiles.length > 0 ? hydrateProfiles(missingProfiles) : Promise.resolve(),
          missingAchievements.length > 0 ? hydrateAchievements(missingAchievements) : Promise.resolve(),
          missingLikes.length > 0 ? hydrateLikes(missingLikes) : Promise.resolve(),
        ]);
      } finally {
        isHydratingRef.current = false;
      }
    };

    void hydrateAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]); // Only depend on threads - cache objects intentionally excluded to prevent infinite loops

  const loadStatistics = useCallback(async () => {
    if (!user) return;
    try {
      setStatsLoading(true);
      const stats = await getUserStatistics(user.id);
      setStatistics(stats);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setStatsLoading(false);
    }
  }, [user]);

  const loadCommentCount = useCallback(async () => {
    if (!user) return;
    try {
      const payload = await fetchAuthorizedJson("/api/comunidade/comments/count");
      setCommentCount(typeof payload.count === "number" ? payload.count : 0);
    } catch (error) {
      console.error("Erro ao contar comentários:", error);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAuthorizedJson, user]); // setCommentCount excluded - stable setter reference

  const loadUserBadges = useCallback(async () => {
    if (!user) return;
    const badges = await getUserAchievements(user.id);
    setUserBadges(badges);
  }, [user]);

  const evaluateGamification = useCallback(async () => {
    if (!user) return;

    try {
      const supabase = getBrowserClient();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        return;
      }

      const response = await fetch('/api/conquistas', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = (await response.json().catch(() => null)) as AwardResponse | { error?: string } | null;

      if (!response.ok) {
        const errorMessage = payload && 'error' in payload ? payload.error : 'Falha ao atualizar conquistas.';
        throw new Error(errorMessage ?? 'Falha ao atualizar conquistas.');
      }

      if (payload && 'achievements' in payload && payload.achievements) {
        setUserBadges(payload.achievements);
        setAchievementCache((previous) => ({
          ...previous,
          [user.id]: payload.achievements,
        }));
      }
    } catch (error) {
      console.error('Erro ao sincronizar conquistas:', error);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    void loadStatistics();
    void loadUserBadges();
    void loadCommentCount();
  }, [authLoading, user, loadCommentCount, loadStatistics, loadUserBadges]);

  // Track if gamification has been evaluated to prevent re-evaluation loops
  const hasEvaluatedGamificationRef = useRef(false);

  useEffect(() => {
    if (!user || !statistics || hasEvaluatedGamificationRef.current) {
      return;
    }

    // Only evaluate once when we have valid user and statistics
    hasEvaluatedGamificationRef.current = true;
    void evaluateGamification();
  }, [evaluateGamification, statistics, user]); // Remove commentCount - it causes loops

  const handleDeletePost = async (postId: string) => {
    if (!user) return;
    const target = threads.find((thread) => thread.id === postId);
    if (!target || target.user_id !== user.id) {
      return;
    }

    const shouldDelete = window.confirm("Tem certeza de que deseja remover este post? Esta ação não pode ser desfeita.");
    if (!shouldDelete) {
      return;
    }

    try {
      setDeletingPostId(postId);

      await fetchAuthorizedJson(`/api/comunidade/posts/${postId}`, {
        method: "DELETE",
      });

      setThreads((previous) => previous.filter((thread) => thread.id !== postId));
    } catch (error) {
      console.error("Erro ao remover post:", error);
      setPostsError("Não foi possível excluir este post. Tente novamente em instantes.");
    } finally {
      setDeletingPostId(null);
    }
  };

  const handleCreatePost = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || !selectedTopicId) return;

    const trimmedTitle = newPostTitle.trim();
    const trimmedContent = newPostContent.trim();
    if (!trimmedTitle || !trimmedContent) {
      setPostsError("Preencha título e conteúdo antes de publicar.");
      return;
    }

    try {
      setCreatingPost(true);
      setPostsError(null);

      const payload = await fetchAuthorizedJson("/api/comunidade/posts", {
        method: "POST",
        body: JSON.stringify({
          title: trimmedTitle,
          content: trimmedContent,
          topicId: selectedTopicId,
        }),
      });

      const createdPost = payload.post as CommunityPost | undefined;

      if (createdPost) {
        const newThread: CommunityThread = { ...createdPost, comments: [] };
        setThreads((previous) => [newThread, ...previous]);
      }

      setNewPostTitle("");
      setNewPostContent("");
    } catch (error) {
      console.error("Erro ao criar post:", error);
      setPostsError("Não foi possível publicar agora. Tente novamente.");
    } finally {
      setCreatingPost(false);
    }
  };

  const handleCommentChange = (postId: string, value: string) => {
    setCommentDrafts((previous) => ({
      ...previous,
      [postId]: value,
    }));
  };

  const handleDeleteComment = async (commentId: string, postId: string) => {
    if (!user) return;
    const targetThread = threads.find((thread) => thread.id === postId);
    const targetComment = targetThread?.comments.find((comment) => comment.id === commentId);
    if (!targetComment || targetComment.user_id !== user.id) {
      return;
    }

    const confirmed = window.confirm("Remover este comentário definitivamente?");
    if (!confirmed) {
      return;
    }

    try {
      setCommentDeleting((previous) => ({ ...previous, [commentId]: true }));

      await fetchAuthorizedJson(`/api/comunidade/comments/${commentId}`, {
        method: "DELETE",
      });

      setThreads((previous) =>
        previous.map((thread) => {
          if (thread.id === postId) {
            return { ...thread, comments: thread.comments.filter((comment) => comment.id !== commentId) };
          }
          return thread;
        })
      );
      setCommentCount((previous) => Math.max(0, previous - 1));
    } catch (error) {
      console.error("Erro ao remover comentário:", error);
      setPostsError("Não foi possível remover o comentário neste momento.");
    } finally {
      setCommentDeleting((previous) => {
        const clone = { ...previous };
        delete clone[commentId];
        return clone;
      });
    }
  };

  const handleSendComment = async (event: FormEvent, postId: string) => {
    event.preventDefault();
    if (!user) return;

    const rawContent = commentDrafts[postId]?.trim();
    if (!rawContent) {
      setPostsError("Digite um comentário antes de enviar.");
      return;
    }

    try {
      setCommentLoading((previous) => ({ ...previous, [postId]: true }));
      setPostsError(null);

      const payload = await fetchAuthorizedJson("/api/comunidade/comments", {
        method: "POST",
        body: JSON.stringify({
          content: rawContent,
          postId,
        }),
      });

      const insertedComment = payload.comment as CommunityComment | undefined;

      if (insertedComment) {
        setThreads((previous) =>
          previous.map((thread) => {
            if (thread.id === postId) {
              return { ...thread, comments: [...thread.comments, insertedComment] };
            }
            return thread;
          })
        );
        setCommentCount((prev) => prev + 1);
      }

      setCommentDrafts((previous) => ({ ...previous, [postId]: "" }));
    } catch (error) {
      console.error("Erro ao enviar comentário:", error);
      setPostsError("Não conseguimos enviar seu comentário. Tente novamente.");
    } finally {
      setCommentLoading((previous) => {
        const updated = { ...previous };
        delete updated[postId];
        return updated;
      });
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!user) return;

    setLikeLoading((previous) => ({ ...previous, [postId]: true }));
    const current = postLikes[postId] ?? { count: 0, liked: false };

    try {
      const endpoint = `/api/comunidade/posts/${postId}/likes`;
      const payload = current.liked
        ? await fetchAuthorizedJson(endpoint, { method: "DELETE" })
        : await fetchAuthorizedJson(endpoint, { method: "POST" });

      const nextState = {
        count: typeof payload.count === "number" ? payload.count : current.count,
        liked: typeof payload.liked === "boolean" ? payload.liked : !current.liked,
      };

      setPostLikes((previous) => ({
        ...previous,
        [postId]: nextState,
      }));
    } catch (error) {
      console.error("Erro ao atualizar curtida:", error);
      setPostsError("Não conseguimos registrar sua reação agora.");
    } finally {
      setLikeLoading((previous) => {
        const updated = { ...previous };
        delete updated[postId];
        return updated;
      });
    }
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    try {
      setPreferencesSaving(true);
      setPreferencesMessage(null);
      await updateCommunitySettings(user.id, {
        community_tagline: taglineDraft.trim() || null,
        community_show_statistics: showStatsToggle,
      });
      await refreshProfile();
      setPreferencesMessage("Preferências atualizadas com sucesso.");
    } catch (error) {
      console.error("Erro ao salvar preferências:", error);
      setPreferencesMessage("Não foi possível salvar agora. Tente novamente.");
    } finally {
      setPreferencesSaving(false);
    }
  };

  const handleAgeConfirmation = async () => {
    if (!user || !ageCheckbox) return;
    try {
      setConsentSaving(true);
      await confirmCommunityAge(user.id);
      await refreshProfile();
    } catch (error) {
      console.error("Erro ao confirmar idade:", error);
    } finally {
      setConsentSaving(false);
    }
  };

  const handleTermsAcceptance = async () => {
    if (!user || !termsCheckbox) return;
    try {
      setConsentSaving(true);
      await acceptCommunityTerms(user.id);
      await refreshProfile();
    } catch (error) {
      console.error("Erro ao aceitar termos:", error);
    } finally {
      setConsentSaving(false);
    }
  };

  const getUserName = useCallback(
    (userId: string) => {
      if (profile && profile.user_id === userId) {
        return profile.nome_completo ?? (user?.email ?? "Você");
      }
      if (profileCache[userId]?.nome_completo) {
        return profileCache[userId].nome_completo;
      }
      return "Estudante ENEM";
    },
    [profile, profileCache, user?.email]
  );

  const getInitial = (userId: string) => {
    const name = getUserName(userId);
    if (!name) return "E";
    return name.trim().charAt(0).toUpperCase() || "E";
  };

  const selectedTopic = useMemo(
    () => topics.find((topic) => topic.id === selectedTopicId) ?? null,
    [topics, selectedTopicId]
  );

  const needsAgeConfirmation = Boolean(
    profile && (!profile.is_over_16 || !profile.community_age_confirmed_at)
  );
  const needsTermsAcceptance = Boolean(
    profile && profile.community_terms_version !== COMMUNITY_TERMS_VERSION
  );

  if (authLoading) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="loader" aria-label="Carregando comunidade" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl card border-0 p-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            Comunidade exclusiva
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground sm:text-4xl">Faça login para acessar a comunidade</h1>
          <p className="mt-4 text-base text-foreground/70">
            Os fóruns e comentários ficam disponíveis apenas para estudantes autenticados para manter o espaço seguro.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/auth/login?redirect=/comunidade" className="btn btn-primary px-8 py-3 text-base">
              Entrar na minha conta
            </Link>
            <Link href="/auth/register" className="btn btn-outline px-8 py-3 text-base font-semibold text-primary">
              Criar conta gratuita
            </Link>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="loader" aria-label="Carregando perfil" />
      </main>
    );
  }

  if (needsAgeConfirmation) {
    return (
      <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl card border-0 p-10">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Confirme que tem 16 anos ou mais</h1>
          <p className="mt-4 text-base text-foreground/70">
            Para proteger menores de idade e seguir a LGPD, a comunidade fica disponível apenas para estudantes com 16 anos ou mais.
          </p>
          <label className="mt-8 flex items-start gap-3 rounded-xl bg-muted-bg/30 p-4 text-sm text-foreground/80 cursor-pointer hover:bg-muted-bg/50 transition-colors">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
              checked={ageCheckbox}
              onChange={(event) => setAgeCheckbox(event.target.checked)}
            />
            <span>Confirmo que tenho 16 anos ou mais e compreendo que informações falsas podem levar ao bloqueio da conta.</span>
          </label>
          <button
            type="button"
            className="btn btn-primary mt-8 px-8 py-3"
            disabled={!ageCheckbox || consentSaving}
            onClick={handleAgeConfirmation}
          >
            {consentSaving ? "Registrando confirmação..." : "Continuar"}
          </button>
        </div>
      </main>
    );
  }

  if (needsTermsAcceptance) {
    return (
      <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl card border-0 p-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
            Termos da comunidade · {COMMUNITY_POLICY_VERSION_LABEL}
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground sm:text-4xl">Aceite os termos da comunidade</h1>
          <p className="mt-4 text-base text-foreground/70">{COMMUNITY_TERMS_SUMMARY}</p>
          <ul className="mt-6 space-y-3 text-sm text-foreground/70">
            <li>• Conteúdos ofensivos ou fora de educação podem ser removidos automaticamente.</li>
            <li>• Comentários ficam visíveis para outros estudantes logados.</li>
            <li>• Moderadores podem suspender contas que tentem plagiar ou vender materiais proibidos.</li>
          </ul>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-primary">
            {COMMUNITY_TERMS_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className="underline decoration-dotted underline-offset-4 hover:text-primary-dark">
                {item.label}
              </Link>
            ))}
          </div>
          <label className="mt-8 flex items-start gap-3 rounded-xl bg-muted-bg/30 p-4 text-sm text-foreground/80 cursor-pointer hover:bg-muted-bg/50 transition-colors">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
              checked={termsCheckbox}
              onChange={(event) => setTermsCheckbox(event.target.checked)}
            />
            <span>Aceito o código de conduta da comunidade e entendo que a moderação pode excluir publicações que violem as regras.</span>
          </label>
          <button
            type="button"
            className="btn btn-primary mt-8 px-8 py-3"
            disabled={!termsCheckbox || consentSaving}
            onClick={handleTermsAcceptance}
          >
            {consentSaving ? "Registrando aceite..." : "Entrar na comunidade"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 pb-24 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
            Comunidade privada
          </div>
          <h1 className="mt-6 text-3xl font-bold text-foreground sm:text-4xl">Troque repertórios e dúvidas com segurança</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-foreground/60">
            Organize debates por tema, peça feedbacks curtos sobre redação e acompanhe discussões moderadas como em um fórum estilo Reddit.
          </p>
          {renderBadges(userBadges)}
          {profile.community_tagline && (
            <p className="mt-4 text-sm font-semibold text-foreground/60">“{profile.community_tagline}”</p>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="card border-0 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Tópicos</h2>
                <button
                  type="button"
                  onClick={() => void reloadTopics()}
                  className="text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  Atualizar
                </button>
              </div>
              {topicsLoading ? (
                <div className="mt-6 space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-10 w-full animate-pulse rounded-xl bg-muted-bg/50" />
                  ))}
                </div>
              ) : topicsError ? (
                <p className="mt-4 text-sm text-danger">{topicsError}</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {topics.length === 0 && (
                    <li className="rounded-xl border border-dashed border-border-color px-4 py-3 text-sm text-foreground/60">
                      Nenhum tópico cadastrado ainda. Solicite à equipe de suporte para criar os primeiros canais.
                    </li>
                  )}
                  {topics.map((topic) => {
                    const isActive = topic.id === selectedTopicId;
                    return (
                      <li key={topic.id}>
                        <button
                          type="button"
                          className={`w-full rounded-xl border px-4 py-3 text-left text-sm transition-all ${
                            isActive
                              ? "border-primary bg-primary/5 text-primary shadow-sm"
                              : "border-transparent bg-muted-bg/30 text-foreground/60 hover:bg-muted-bg/50 hover:text-foreground"
                          }`}
                          onClick={() => setSelectedTopicId(topic.id)}
                        >
                          <p className="font-semibold">{topic.title}</p>
                          {topic.description && <p className="mt-1 text-xs opacity-80">{topic.description}</p>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="card border-0 p-5">
              <h2 className="text-lg font-semibold text-foreground">Regras rápidas</h2>
              <ul className="mt-4 space-y-3 text-sm text-foreground/60">
                {communityGuidelines.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />
                    {rule}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-xl bg-success/10 px-3 py-2 text-sm text-success">
                Conteúdo fora de educação pode ser removido automaticamente.
              </p>
            </div>

            <div className="card border-0 p-5">
              <h2 className="text-lg font-semibold text-foreground">Perfil social</h2>
              <label className="block text-sm font-medium text-foreground/60">
                Frase de destaque
                <textarea
                  value={taglineDraft}
                  onChange={(event) => setTaglineDraft(event.target.value.slice(0, 140))}
                  rows={2}
                  maxLength={140}
                  placeholder="Compartilhe seu objetivo ou frase preferida."
                  className="mt-2 w-full rounded-xl border-0 bg-muted-bg/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm text-foreground/60 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-color text-primary focus:ring-primary"
                  checked={showStatsToggle}
                  onChange={(event) => setShowStatsToggle(event.target.checked)}
                />
                Mostrar minhas notas e estatísticas para outros estudantes
              </label>
              <button
                type="button"
                className="btn btn-primary mt-5 w-full px-4 py-2 text-sm"
                onClick={handleSavePreferences}
                disabled={preferencesSaving}
              >
                {preferencesSaving ? "Salvando..." : "Salvar preferências"}
              </button>
              {preferencesMessage && (
                <p className="mt-3 text-center text-xs text-foreground/60">{preferencesMessage}</p>
              )}
            </div>
          </aside>

          <section className="space-y-6">
            <div className="card border-0 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/60">Tópico selecionado</p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {selectedTopic ? selectedTopic.title : "Escolha um tópico"}
                  </h2>
                  {selectedTopic?.description && (
                    <p className="mt-1 text-sm text-foreground/60">{selectedTopic.description}</p>
                  )}
                </div>
                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    className="btn btn-outline px-4 py-2 text-sm font-semibold"
                    onClick={() => void reloadThreads()}
                    disabled={!selectedTopicId || threadsLoading}
                  >
                    Atualizar feed
                  </button>
                </div>
              </div>
            </div>

            <div className="card border-0 p-6">
              <h3 className="text-lg font-semibold text-foreground">Compartilhe algo com a comunidade</h3>
              <form className="mt-4 space-y-4" onSubmit={handleCreatePost}>
                <label className="block text-sm font-medium text-foreground/60">
                  Título
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(event) => setNewPostTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Ex.: Estratégias para repertório sociocultural"
                    className="mt-2 w-full rounded-xl border-0 bg-muted-bg/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                    disabled={!selectedTopicId || creatingPost}
                  />
                </label>
                <label className="block text-sm font-medium text-foreground/60">
                  Conteúdo
                  <textarea
                    value={newPostContent}
                    onChange={(event) => setNewPostContent(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Explique o contexto, cite fontes ou peça ajuda objetiva."
                    className="mt-2 w-full rounded-xl border-0 bg-muted-bg/30 px-4 py-3 text-sm text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                    disabled={!selectedTopicId || creatingPost}
                  />
                </label>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-foreground/60">
                    Postagens passam por moderação automática quando detectamos termos fora de educação.
                  </span>
                  <button type="submit" className="btn btn-primary px-6 py-2" disabled={creatingPost || !selectedTopicId}>
                    {creatingPost ? "Publicando..." : "Publicar"}
                  </button>
                </div>
              </form>
            </div>

            <div className="card border-0 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/60">Painel público</p>
                  <h3 className="text-xl font-semibold text-foreground">Suas notas e conquistas</h3>
                  <p className="text-sm text-foreground/60">
                    {showStatsToggle
                      ? "Os colegas verão estes dados quando interagir nos tópicos."
                      : "Estatísticas ocultas para outros estudantes."}
                  </p>
                </div>
              </div>
              {statsLoading ? (
                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted-bg/50" />
                  ))}
                </div>
              ) : statistics && showStatsToggle ? (
                <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="rounded-2xl bg-muted-bg/30 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Redações enviadas</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{statistics.total_redacoes ?? 0}</dd>
                    <p className="text-xs text-foreground/60">Média: {Math.round(statistics.media_nota_redacao ?? 0)}</p>
                  </div>
                  <div className="rounded-2xl bg-muted-bg/30 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Questões resolvidas</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{statistics.total_questoes_respondidas ?? 0}</dd>
                    <p className="text-xs text-foreground/60">
                      Taxa de acerto: {Math.round((statistics.taxa_acerto ?? 0) * 100)}%
                    </p>
                  </div>
                  <div className="rounded-2xl bg-muted-bg/30 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Comentários úteis</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{commentCount}</dd>
                    <p className="text-xs text-foreground/60">Meta para mentor: 5 comentários</p>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-border-color bg-muted-bg/10 p-4 text-sm text-foreground/60">
                  Estatísticas ocultas no momento. Ative a opção “Mostrar minhas notas” para exibir aos colegas.
                </p>
              )}
            </div>

            {combinedPostsError && (
              <div className="rounded-2xl border border-danger/30 bg-danger-light/20 p-4 text-sm text-danger">
                {combinedPostsError}
              </div>
            )}

            {threadsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-40 animate-pulse rounded-3xl bg-muted-bg/50" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border-color bg-card-bg p-10 text-center text-sm text-foreground/60">
                Ainda não existem posts neste tópico. Seja a primeira pessoa a compartilhar algo!
              </div>
            ) : (
              <div className="space-y-6">
                {threads.map((thread) => (
                  <article key={thread.id} className="card border-0 p-6">
                    <header className="flex flex-wrap items-center gap-4">
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-base font-semibold text-primary">
                        {getInitial(thread.user_id)}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{getUserName(thread.user_id)}</p>
                        <p className="text-xs text-foreground/60">{formatRelativeTime(thread.created_at)}</p>
                        {profileCache[thread.user_id]?.community_tagline && (
                          <p className="text-xs text-foreground/60">“{profileCache[thread.user_id].community_tagline}”</p>
                        )}
                        {renderBadges(achievementCache[thread.user_id])}
                      </div>
                      <div className="ml-auto flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                            (postLikes[thread.id]?.liked ?? false)
                              ? "border-primary/60 text-primary bg-primary/5"
                              : "border-border-color text-foreground/60 hover:text-primary hover:border-primary/40"
                          }`}
                          onClick={() => handleToggleLike(thread.id)}
                          disabled={likeLoading[thread.id]}
                          aria-pressed={postLikes[thread.id]?.liked ?? false}
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M4.318 6.318a4.5 4.5 0 016.364 0L12 7.636l1.318-1.318a4.5 4.5 0 116.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 010-6.364z"
                            />
                          </svg>
                          {postLikes[thread.id]?.count ?? 0}
                        </button>
                        {thread.user_id === user?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeletePost(thread.id)}
                            disabled={deletingPostId === thread.id}
                            className="inline-flex items-center gap-2 rounded-full border border-border-color px-3 py-1 text-xs font-semibold text-foreground/60 transition-colors hover:text-danger hover:border-danger/40"
                          >
                            {deletingPostId === thread.id ? "Removendo..." : "Excluir post"}
                            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V5a2 2 0 00-2-2h-2a2 2 0 00-2 2v2m-4 0h14" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </header>

                    <div className="mt-4">
                      <h3 className="text-xl font-semibold text-foreground">{thread.title}</h3>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/60">{thread.content}</p>
                    </div>

                    <footer className="mt-6 border-t border-border-color/50 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
                        {thread.comments.length} comentário{thread.comments.length === 1 ? "" : "s"}
                      </p>

                      <div className="mt-4 space-y-4">
                        {thread.comments.map((comment) => (
                          <div key={comment.id} className="rounded-xl bg-muted-bg/30 p-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {getInitial(comment.user_id)}
                              </span>
                              <div className="text-xs text-foreground/60">
                                <p className="font-semibold text-foreground">{getUserName(comment.user_id)}</p>
                                <p>{formatRelativeTime(comment.created_at)}</p>
                              </div>
                              {comment.user_id === user?.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(comment.id, thread.id)}
                                  disabled={commentDeleting[comment.id]}
                                  className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-foreground/60 hover:text-danger"
                                >
                                  {commentDeleting[comment.id] ? "Removendo..." : "Excluir"}
                                </button>
                              )}
                            </div>
                            <p className="mt-2 text-sm text-foreground/80">{comment.content}</p>
                            {renderBadges(achievementCache[comment.user_id])}
                          </div>
                        ))}
                      </div>

                      <form className="mt-5 space-y-3" onSubmit={(event) => handleSendComment(event, thread.id)}>
                        <textarea
                          value={commentDrafts[thread.id] ?? ""}
                          onChange={(event) => handleCommentChange(thread.id, event.target.value)}
                          rows={2}
                          maxLength={500}
                          placeholder="Adicionar comentário..."
                          className="w-full rounded-xl border-0 bg-muted-bg/30 px-4 py-2 text-sm text-foreground placeholder:text-foreground/40 focus:ring-2 focus:ring-primary focus:outline-none"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="btn btn-outline px-4 py-2 text-sm font-semibold"
                            disabled={commentLoading[thread.id]}
                          >
                            {commentLoading[thread.id] ? "Enviando..." : "Responder"}
                          </button>
                        </div>
                      </form>
                    </footer>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
