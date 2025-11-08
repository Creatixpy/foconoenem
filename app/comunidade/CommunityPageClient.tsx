"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { RealtimeChannel } from "@supabase/supabase-js";
import {
  COMMUNITY_TERMS_VERSION,
  acceptCommunityTerms,
  confirmCommunityAge,
  getUserAchievements,
  getUserStatistics,
  type UserAchievement,
  type UserStatistics,
  updateCommunitySettings,
} from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type CommunityTopic = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  created_at: string;
};

type CommunityPost = {
  id: string;
  topic_id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

type CommunityComment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type ProfilePreview = {
  user_id: string;
  nome_completo: string | null;
  avatar_url: string | null;
  community_tagline: string | null;
  community_show_statistics: boolean | null;
};

type CommunityThread = CommunityPost & { comments: CommunityComment[] };

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

const profileFields =
  "user_id,nome_completo,avatar_url,community_tagline,community_show_statistics";

const commentCountSelectOptions = { head: true, count: "exact" as const };
const likeSelectOptions = "post_id,user_id";

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
  const [topics, setTopics] = useState<CommunityTopic[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [topicsError, setTopicsError] = useState<string | null>(null);

  const [threads, setThreads] = useState<CommunityThread[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
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
  const [postLikes, setPostLikes] = useState<Record<string, { count: number; liked: boolean }>>({});
  const [likeLoading, setLikeLoading] = useState<Record<string, boolean>>({});

  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [commentCount, setCommentCount] = useState(0);

  const [userBadges, setUserBadges] = useState<UserAchievement[]>([]);

  const [taglineDraft, setTaglineDraft] = useState("");
  const [showStatsToggle, setShowStatsToggle] = useState(true);
  const [preferencesSaving, setPreferencesSaving] = useState(false);
  const [preferencesMessage, setPreferencesMessage] = useState<string | null>(null);

  const [ageCheckbox, setAgeCheckbox] = useState(false);
  const [termsCheckbox, setTermsCheckbox] = useState(false);
  const [consentSaving, setConsentSaving] = useState(false);

  const realtimeChannelRef = useRef<RealtimeChannel | null>(null);

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

  useEffect(() => {
    if (!user || !selectedTopicId) {
      if (realtimeChannelRef.current) {
        supabase.removeChannel(realtimeChannelRef.current);
        realtimeChannelRef.current = null;
      }
      return;
    }

    const channel = supabase
      .channel(`community-feed-${selectedTopicId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_posts" },
        (payload) => {
          const newPost = payload.new as CommunityPost;
          if (newPost.topic_id !== selectedTopicId) return;
          setThreads((previous) => {
            if (previous.some((thread) => thread.id === newPost.id)) {
              return previous;
            }
            return [{ ...newPost, comments: [] }, ...previous];
          });
          void hydrateProfiles([newPost.user_id]);
          void hydrateAchievements([newPost.user_id]);
          setPostLikes((previous) => ({
            ...previous,
            [newPost.id]: { count: 0, liked: false },
          }));
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "community_comments" },
        (payload) => {
          const newComment = payload.new as CommunityComment;
          setThreads((previous) =>
            previous.map((thread) => {
              if (thread.id === newComment.post_id) {
                return { ...thread, comments: [...thread.comments, newComment] };
              }
              return thread;
            })
          );
          void hydrateProfiles([newComment.user_id]);
          void hydrateAchievements([newComment.user_id]);
          if (newComment.user_id === user.id) {
            setCommentCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    realtimeChannelRef.current = channel;

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
      realtimeChannelRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedTopicId]);

  const loadTopics = useCallback(async () => {
    try {
      setTopicsLoading(true);
      setTopicsError(null);
      const { data, error } = await supabase
        .from("community_topics")
        .select("*")
        .order("title", { ascending: true });

      if (error) throw error;

      const topicList = data ?? [];
      setTopics(topicList);
      setSelectedTopicId((previous) => {
        if (previous && topicList.some((topic) => topic.id === previous)) {
          return previous;
        }
        return topicList[0]?.id ?? null;
      });
    } catch (error) {
      console.error("Erro ao carregar tópicos:", error);
      setTopicsError("Não foi possível carregar os tópicos agora. Tente novamente em alguns minutos.");
      setTopics([]);
      setSelectedTopicId(null);
    } finally {
      setTopicsLoading(false);
    }
  }, []);

  const hydrateProfiles = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select(profileFields)
        .in("user_id", userIds);

      if (error) throw error;
      if (!data) return;

      setProfileCache((previous) => {
        const next = { ...previous };
        data.forEach((item) => {
          next[item.user_id] = item;
        });
        return next;
      });
    } catch (error) {
      console.error("Erro ao buscar perfis:", error);
    }
  }, []);

  const hydrateAchievements = useCallback(async (userIds: string[]) => {
    if (userIds.length === 0) return;
    try {
      const { data, error } = await supabase
        .from("user_achievements")
        .select("user_id,id,achievement_id,earned_at,metadata,achievement:achievements(*)")
        .in("user_id", userIds);

      if (error) throw error;
      if (!data) return;

      const grouped = data.reduce<Record<string, UserAchievement[]>>((accumulator, item) => {
        const list = accumulator[item.user_id] ?? [];
        const typedItem = item as unknown as UserAchievement;
        list.push(typedItem);
        accumulator[item.user_id] = list;
        return accumulator;
      }, {});

      setAchievementCache((previous) => ({ ...previous, ...grouped }));
    } catch (error) {
      console.error("Erro ao buscar badges:", error);
    }
  }, []);

  const hydrateLikes = useCallback(
    async (postIds: string[]) => {
      if (postIds.length === 0) return;
      try {
        const { data, error } = await supabase
          .from("community_post_likes")
          .select(likeSelectOptions)
          .in("post_id", postIds);

        if (error) {
          throw error;
        }

        const map: Record<string, { count: number; liked: boolean }> = {};
        (data ?? []).forEach((like) => {
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
    [user?.id]
  );

  const loadPosts = useCallback(
    async (topicId: string) => {
      try {
        setPostsLoading(true);
        setPostsError(null);

        const { data: postsData, error: postsErrorResponse } = await supabase
          .from("community_posts")
          .select("*")
          .eq("topic_id", topicId)
          .order("created_at", { ascending: false })
          .limit(25);

        if (postsErrorResponse) {
          throw postsErrorResponse;
        }

        const postsList = postsData ?? [];
        const postIds = postsList.map((post) => post.id);

        let comments: CommunityComment[] = [];
        if (postIds.length > 0) {
          const { data: commentsData, error: commentsError } = await supabase
            .from("community_comments")
            .select("*")
            .in("post_id", postIds)
            .order("created_at", { ascending: true });

          if (commentsError) {
            throw commentsError;
          }

          comments = commentsData ?? [];
        }

        const userIds = new Set<string>();
        postsList.forEach((post) => userIds.add(post.user_id));
        comments.forEach((comment) => userIds.add(comment.user_id));

        const commentsByPost = comments.reduce<Record<string, CommunityComment[]>>((accumulator, comment) => {
          accumulator[comment.post_id] = accumulator[comment.post_id]
            ? [...accumulator[comment.post_id], comment]
            : [comment];
          return accumulator;
        }, {});

        setThreads(
          postsList.map((post) => ({
            ...post,
            comments: commentsByPost[post.id] ?? [],
          }))
        );

        void hydrateProfiles(Array.from(userIds));
        void hydrateAchievements(Array.from(userIds));
        void hydrateLikes(postIds);
      } catch (error) {
        console.error("Erro ao carregar posts:", error);
        setPostsError("Não foi possível carregar os posts deste tópico no momento.");
        setThreads([]);
      } finally {
        setPostsLoading(false);
      }
    },
    [hydrateAchievements, hydrateLikes, hydrateProfiles]
  );

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
      const { count, error } = await supabase
        .from("community_comments")
        .select("*", commentCountSelectOptions)
        .eq("user_id", user.id);

      if (error) throw error;
      setCommentCount(count ?? 0);
    } catch (error) {
      console.error("Erro ao contar comentários:", error);
    }
  }, [user]);

  const loadUserBadges = useCallback(async () => {
    if (!user) return;
    const badges = await getUserAchievements(user.id);
    setUserBadges(badges);
  }, [user]);

  const evaluateGamification = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke<AwardResponse>("award-achievements", {
        body: {},
      });

      if (error) {
        throw error;
      }

      if (data?.achievements) {
        setUserBadges(data.achievements);
        setAchievementCache((previous) => ({
          ...previous,
          [user.id]: data.achievements,
        }));
      }
    } catch (error) {
      console.error("Erro ao sincronizar conquistas:", error);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }

    void loadTopics();
    void loadStatistics();
    void loadUserBadges();
    void loadCommentCount();
  }, [authLoading, user, loadCommentCount, loadStatistics, loadTopics, loadUserBadges]);

  useEffect(() => {
    if (user && selectedTopicId) {
      void loadPosts(selectedTopicId);
    }
  }, [user, selectedTopicId, loadPosts]);

  useEffect(() => {
    if (!user || !statistics) {
      return;
    }

    void evaluateGamification();
  }, [evaluateGamification, statistics, user, commentCount]);

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
      const { error } = await supabase.from("community_posts").delete().eq("id", postId).eq("user_id", user.id);
      if (error) {
        throw error;
      }
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

      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          title: trimmedTitle,
          content: trimmedContent,
          topic_id: selectedTopicId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const newThread: CommunityThread = {
          ...(data as CommunityPost),
          comments: [],
        };
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
      const { error } = await supabase.from("community_comments").delete().eq("id", commentId).eq("user_id", user.id);
      if (error) {
        throw error;
      }
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

      const { data, error } = await supabase
        .from("community_comments")
        .insert({
          content: rawContent,
          post_id: postId,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        const insertedComment = data as CommunityComment;
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
    const liked = current.liked;

    try {
      if (liked) {
        const { error } = await supabase
          .from("community_post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", user.id);
        if (error) throw error;
        setPostLikes((previous) => ({
          ...previous,
          [postId]: {
            count: Math.max(0, current.count - 1),
            liked: false,
          },
        }));
      } else {
        const { error } = await supabase.from("community_post_likes").insert({
          post_id: postId,
          user_id: user.id,
        });
        if (error) throw error;
        setPostLikes((previous) => ({
          ...previous,
          [postId]: {
            count: current.count + 1,
            liked: true,
          },
        }));
      }
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
        <div className="mx-auto max-w-2xl rounded-[2.5rem] border border-border-color/60 bg-card-bg/80 p-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
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
            <Link href="/auth/register" className="btn btn-glass px-8 py-3 text-base font-semibold text-primary">
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
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border-color/60 bg-card-bg/80 p-10">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Confirme que tem 16 anos ou mais</h1>
          <p className="mt-4 text-base text-foreground/70">
            Para proteger menores de idade e seguir a LGPD, a comunidade fica disponível apenas para estudantes com 16 anos ou mais.
          </p>
          <label className="mt-8 flex items-start gap-3 rounded-2xl border border-border-color/60 bg-muted-bg/20 p-4 text-sm text-foreground/80">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-color/70 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
        <div className="mx-auto max-w-3xl rounded-[2.5rem] border border-border-color/60 bg-card-bg/80 p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold text-accent">
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
              <Link key={item.href} href={item.href} className="underline decoration-dotted underline-offset-4">
                {item.label}
              </Link>
            ))}
          </div>
          <label className="mt-8 flex items-start gap-3 rounded-2xl border border-border-color/60 bg-muted-bg/20 p-4 text-sm text-foreground/80">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border-color/70 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-sm font-semibold text-accent">
            Comunidade privada
          </div>
          <h1 className="mt-6 text-3xl font-semibold text-foreground sm:text-4xl">Troque repertórios e dúvidas com segurança</h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-foreground/70">
            Organize debates por tema, peça feedbacks curtos sobre redação e acompanhe discussões moderadas como em um fórum estilo Reddit.
          </p>
          {renderBadges(userBadges)}
          {profile.community_tagline && (
            <p className="mt-4 text-sm font-semibold text-foreground/70">“{profile.community_tagline}”</p>
          )}
        </header>

        <section className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-6">
            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Tópicos</h2>
                <button
                  type="button"
                  onClick={() => void loadTopics()}
                  className="text-sm font-semibold text-primary hover:text-primary-dark"
                >
                  Atualizar
                </button>
              </div>
              {topicsLoading ? (
                <div className="mt-6 space-y-3">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="h-10 w-full animate-pulse rounded-2xl bg-muted-bg/60" />
                  ))}
                </div>
              ) : topicsError ? (
                <p className="mt-4 text-sm text-danger">{topicsError}</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {topics.length === 0 && (
                    <li className="rounded-2xl border border-dashed border-border-color/50 px-4 py-3 text-sm text-foreground/70">
                      Nenhum tópico cadastrado ainda. Solicite à equipe de suporte para criar os primeiros canais.
                    </li>
                  )}
                  {topics.map((topic) => {
                    const isActive = topic.id === selectedTopicId;
                    return (
                      <li key={topic.id}>
                        <button
                          type="button"
                          className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition-all ${
                            isActive
                              ? "border-primary/50 bg-primary/10 text-foreground shadow-inner"
                              : "border-border-color/60 text-foreground/80 hover:border-primary/40"
                          }`}
                          onClick={() => setSelectedTopicId(topic.id)}
                        >
                          <p className="font-semibold">{topic.title}</p>
                          {topic.description && <p className="mt-1 text-xs text-foreground/60">{topic.description}</p>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-5">
              <h2 className="text-lg font-semibold text-foreground">Regras rápidas</h2>
              <ul className="mt-4 space-y-3 text-sm text-foreground/70">
                {communityGuidelines.map((rule) => (
                  <li key={rule} className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" aria-hidden />
                    {rule}
                  </li>
                ))}
              </ul>
              <p className="mt-4 rounded-2xl bg-success/10 px-3 py-2 text-sm text-success">
                Conteúdo fora de educação pode ser removido automaticamente.
              </p>
            </div>

            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-5">
              <h2 className="text-lg font-semibold text-foreground">Perfil social</h2>
              <label className="block text-sm font-medium text-foreground/80">
                Frase de destaque
                <textarea
                  value={taglineDraft}
                  onChange={(event) => setTaglineDraft(event.target.value.slice(0, 140))}
                  rows={2}
                  maxLength={140}
                  placeholder="Compartilhe seu objetivo ou frase preferida."
                  className="mt-2 w-full rounded-2xl border border-border-color/60 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                />
              </label>
              <label className="mt-4 flex items-center gap-3 text-sm text-foreground/80">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border-color/70 text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Tópico selecionado</p>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {selectedTopic ? selectedTopic.title : "Escolha um tópico"}
                  </h2>
                  {selectedTopic?.description && (
                    <p className="mt-1 text-sm text-foreground/70">{selectedTopic.description}</p>
                  )}
                </div>
                <div className="ml-auto flex gap-3">
                  <button
                    type="button"
                    className="btn btn-glass px-4 py-2 text-sm font-semibold text-primary"
                    onClick={() => selectedTopicId && void loadPosts(selectedTopicId)}
                    disabled={!selectedTopicId || postsLoading}
                  >
                    Atualizar feed
                  </button>
                </div>
              </div>
            </div>

            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-6">
              <h3 className="text-lg font-semibold text-foreground">Compartilhe algo com a comunidade</h3>
              <form className="mt-4 space-y-4" onSubmit={handleCreatePost}>
                <label className="block text-sm font-medium text-foreground/80">
                  Título
                  <input
                    type="text"
                    value={newPostTitle}
                    onChange={(event) => setNewPostTitle(event.target.value)}
                    maxLength={120}
                    placeholder="Ex.: Estratégias para repertório sociocultural"
                    className="mt-2 w-full rounded-2xl border border-border-color/60 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                    disabled={!selectedTopicId || creatingPost}
                  />
                </label>
                <label className="block text-sm font-medium text-foreground/80">
                  Conteúdo
                  <textarea
                    value={newPostContent}
                    onChange={(event) => setNewPostContent(event.target.value)}
                    rows={4}
                    maxLength={2000}
                    placeholder="Explique o contexto, cite fontes ou peça ajuda objetiva."
                    className="mt-2 w-full rounded-2xl border border-border-color/60 bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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

            <div className="glass-card border border-border-color/60 bg-card-bg/80 p-6">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground/70">Painel público</p>
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
                  <div className="rounded-2xl border border-border-color/50 bg-muted-bg/20 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Redações enviadas</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{statistics.total_redacoes ?? 0}</dd>
                    <p className="text-xs text-foreground/60">Média: {Math.round(statistics.media_nota_redacao ?? 0)}</p>
                  </div>
                  <div className="rounded-2xl border border-border-color/50 bg-muted-bg/20 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Questões resolvidas</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{statistics.total_questoes_respondidas ?? 0}</dd>
                    <p className="text-xs text-foreground/60">
                      Taxa de acerto: {Math.round((statistics.taxa_acerto ?? 0) * 100)}%
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border-color/50 bg-muted-bg/20 p-4">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-foreground/60">Comentários úteis</dt>
                    <dd className="mt-2 text-2xl font-semibold text-foreground">{commentCount}</dd>
                    <p className="text-xs text-foreground/60">Meta para mentor: 5 comentários</p>
                  </div>
                </dl>
              ) : (
                <p className="mt-4 rounded-2xl border border-dashed border-border-color/50 bg-muted-bg/20 p-4 text-sm text-foreground/70">
                  Estatísticas ocultas no momento. Ative a opção “Mostrar minhas notas” para exibir aos colegas.
                </p>
              )}
            </div>

            {postsError && (
              <div className="rounded-2xl border border-danger/30 bg-danger-light/20 p-4 text-sm text-danger">
                {postsError}
              </div>
            )}

            {postsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="h-40 animate-pulse rounded-3xl bg-muted-bg/70" />
                ))}
              </div>
            ) : threads.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border-color/50 bg-card-bg/60 p-10 text-center text-sm text-foreground/70">
                Ainda não existem posts neste tópico. Seja a primeira pessoa a compartilhar algo!
              </div>
            ) : (
              <div className="space-y-6">
                {threads.map((thread) => (
                  <article key={thread.id} className="glass-card border border-border-color/60 bg-card-bg/80 p-6">
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
                              ? "border-primary/60 text-primary"
                              : "border-border-color/60 text-foreground/70 hover:text-primary"
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
                            className="inline-flex items-center gap-2 rounded-full border border-border-color/60 px-3 py-1 text-xs font-semibold text-foreground/70 transition-colors hover:text-danger"
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
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{thread.content}</p>
                    </div>

                    <footer className="mt-6 border-t border-border-color/50 pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
                        {thread.comments.length} comentário{thread.comments.length === 1 ? "" : "s"}
                      </p>

                      <div className="mt-4 space-y-4">
                        {thread.comments.map((comment) => (
                          <div key={comment.id} className="rounded-2xl border border-border-color/40 bg-muted-bg/30 p-3">
                            <div className="flex items-center gap-3">
                              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {getInitial(comment.user_id)}
                              </span>
                              <div className="text-xs text-foreground/70">
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
                          className="w-full rounded-2xl border border-border-color/60 bg-transparent px-4 py-2 text-sm text-foreground placeholder:text-foreground/50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                        />
                        <div className="flex justify-end">
                          <button
                            type="submit"
                            className="btn btn-glass px-4 py-2 text-sm font-semibold text-primary"
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
