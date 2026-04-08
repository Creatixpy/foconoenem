/**
 * Data Transformers
 * Convert between database rows and application models
 */

import type {
  UserProfileRow,
  UserProfile,
  UserStatisticsRow,
  UserStatistics,
  NoticiaRow,
  Noticia,
  CommunityPostRow,
  CommunityPost,
} from './types';
import type { Database } from '@/types/supabase';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely parse a numeric value from various input types
 */
function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

// ============================================================================
// User Profile Transformers
// ============================================================================

export function toUserProfile(row: UserProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    nomeCompleto: row.nome_completo,
    avatarUrl: row.avatar_url,
    bio: row.bio,
    objetivo: row.objetivo,
    anoEnem: row.ano_enem,
    communityTagline: row.community_tagline,
    communityProfileTheme: row.community_profile_theme,
    communityShowStatistics: row.community_show_statistics,
    communityTermsVersion: row.community_terms_version,
    communityTermsAcceptedAt: row.community_terms_accepted_at,
    communityAgeConfirmedAt: row.community_age_confirmed_at,
    isOver16: row.is_over_16,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromUserProfileUpdate(profile: Partial<UserProfile>): Database['public']['Tables']['user_profiles']['Update'] {
  const updates: Database['public']['Tables']['user_profiles']['Update'] = {};
  
  if (profile.nomeCompleto !== undefined) updates.nome_completo = profile.nomeCompleto;
  if (profile.avatarUrl !== undefined) updates.avatar_url = profile.avatarUrl;
  if (profile.bio !== undefined) updates.bio = profile.bio;
  if (profile.objetivo !== undefined) updates.objetivo = profile.objetivo;
  if (profile.anoEnem !== undefined) updates.ano_enem = profile.anoEnem;
  if (profile.communityTagline !== undefined) updates.community_tagline = profile.communityTagline;
  if (profile.communityProfileTheme !== undefined) updates.community_profile_theme = profile.communityProfileTheme;
  if (profile.communityShowStatistics !== undefined) updates.community_show_statistics = profile.communityShowStatistics;
  if (profile.communityTermsVersion !== undefined) updates.community_terms_version = profile.communityTermsVersion;
  if (profile.communityTermsAcceptedAt !== undefined) updates.community_terms_accepted_at = profile.communityTermsAcceptedAt;
  if (profile.communityAgeConfirmedAt !== undefined) updates.community_age_confirmed_at = profile.communityAgeConfirmedAt;
  if (profile.isOver16 !== undefined) updates.is_over_16 = profile.isOver16;
  
  return updates;
}

// ============================================================================
// User Statistics Transformers
// ============================================================================

export function toUserStatistics(row: UserStatisticsRow): UserStatistics {
  return {
    id: row.id,
    userId: row.user_id,
    totalRedacoes: row.total_redacoes,
    mediaNotaRedacao: parseNumeric(row.media_nota_redacao),
    melhorNotaRedacao: row.melhor_nota_redacao,
    piorNotaRedacao: row.pior_nota_redacao,
    mediaCompetencia1: parseNumeric(row.media_competencia1),
    mediaCompetencia2: parseNumeric(row.media_competencia2),
    mediaCompetencia3: parseNumeric(row.media_competencia3),
    mediaCompetencia4: parseNumeric(row.media_competencia4),
    mediaCompetencia5: parseNumeric(row.media_competencia5),
    totalSimulados: row.total_simulados,
    totalQuestoesRespondidas: row.total_questoes_respondidas,
    totalAcertos: row.total_acertos,
    totalErros: row.total_erros,
    taxaAcerto: parseNumeric(row.taxa_acerto),
    acertosPorDisciplina: {
      matematica: { acertos: row.acertos_matematica, total: row.total_matematica },
      portugues: { acertos: row.acertos_portugues, total: row.total_portugues },
      quimica: { acertos: row.acertos_quimica, total: row.total_quimica },
      fisica: { acertos: row.acertos_fisica, total: row.total_fisica },
      geografia: { acertos: row.acertos_geografia, total: row.total_geografia },
    },
    ultimaAtualizacao: row.ultima_atualizacao,
  };
}

// ============================================================================
// News Transformers
// ============================================================================

export function toNoticia(row: NoticiaRow): Noticia {
  return {
    id: row.id,
    titulo: row.titulo,
    slug: row.slug,
    resumo: row.resumo,
    conteudo: row.conteudo,
    imagemUrl: row.imagem_url,
    autor: row.autor,
    dataPublicacao: row.data_publicacao,
    tags: row.tags,
    destaque: row.destaque,
    fonteUrl: row.fonte_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function fromNoticiaInsert(noticia: Omit<Noticia, 'id' | 'createdAt' | 'updatedAt'>): Record<string, unknown> {
  return {
    titulo: noticia.titulo,
    slug: noticia.slug,
    resumo: noticia.resumo,
    conteudo: noticia.conteudo,
    imagem_url: noticia.imagemUrl,
    autor: noticia.autor,
    data_publicacao: noticia.dataPublicacao,
    tags: noticia.tags,
    destaque: noticia.destaque,
    fonte_url: noticia.fonteUrl,
  };
}

// ============================================================================
// Community Transformers
// ============================================================================

export function toCommunityPost(
  row: CommunityPostRow,
  extras?: {
    author?: { nome_completo: string | null; avatar_url: string | null };
    likesCount?: number;
    commentsCount?: number;
    userHasLiked?: boolean;
  }
): CommunityPost {
  return {
    id: row.id,
    topicId: row.topic_id,
    userId: row.user_id,
    title: row.title,
    content: row.content,
    status: row.status as CommunityPost['status'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lastActivityAt: row.last_activity_at,
    ...(extras?.author && {
      author: {
        nomeCompleto: extras.author.nome_completo,
        avatarUrl: extras.author.avatar_url,
      },
    }),
    ...(extras?.likesCount !== undefined && { likesCount: extras.likesCount }),
    ...(extras?.commentsCount !== undefined && { commentsCount: extras.commentsCount }),
    ...(extras?.userHasLiked !== undefined && { userHasLiked: extras.userHasLiked }),
  };
}
