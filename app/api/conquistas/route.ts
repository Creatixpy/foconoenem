import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';

const ACHIEVEMENT_SLUGS = ['primeira_redacao', 'maratona_questoes', 'nota_mil', 'mentor_comunitario'] as const;
type AchievementSlug = (typeof ACHIEVEMENT_SLUGS)[number];

type AwardContext = {
  total_redacoes: number | null;
  total_questoes_respondidas: number | null;
  media_nota_redacao: number | null;
  comment_count: number;
};

const checkConditions = (context: AwardContext): Record<AchievementSlug, boolean> => ({
  primeira_redacao: (context.total_redacoes ?? 0) >= 1,
  maratona_questoes: (context.total_questoes_respondidas ?? 0) >= 50,
  nota_mil: (context.media_nota_redacao ?? 0) >= 900,
  mentor_comunitario: context.comment_count >= 5,
});

export async function POST(request: NextRequest) {
  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { supabase, userId } = auth;

  const [{ data: stats, error: statsError }, { count: commentCount = 0, error: commentsError }] = await Promise.all([
    supabase
      .from('user_statistics')
      .select('total_redacoes,total_questoes_respondidas,media_nota_redacao')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase.from('community_comments').select('*', { head: true, count: 'exact' }).eq('user_id', userId),
  ]);

  if (statsError || commentsError) {
    return NextResponse.json(
      {
        error: 'statistics_error',
        details: statsError?.message ?? commentsError?.message,
      },
      { status: 500 }
    );
  }

  const context: AwardContext = {
    total_redacoes: stats?.total_redacoes ?? 0,
    total_questoes_respondidas: stats?.total_questoes_respondidas ?? 0,
    media_nota_redacao: stats?.media_nota_redacao ?? 0,
    comment_count: commentCount ?? 0,
  };

  const { data: existingAchievements, error: existingError } = await supabase
    .from('user_achievements')
    .select('achievement:achievements(slug)')
    .eq('user_id', userId);

  if (existingError) {
    return NextResponse.json(
      { error: 'load_achievements_failed', details: existingError.message },
      { status: 500 }
    );
  }

  const typedAchievements = existingAchievements ?? [];
  const ownedSlugs = new Set(
    typedAchievements
      .map((entry) => {
        const achievement = Array.isArray(entry.achievement) ? entry.achievement[0] : entry.achievement;
        return achievement?.slug ?? null;
      })
      .filter((slug): slug is string => Boolean(slug))
  );

  const conditions = checkConditions(context);
  const targetSlugs = ACHIEVEMENT_SLUGS.filter((slug) => conditions[slug] && !ownedSlugs.has(slug));

  if (targetSlugs.length > 0) {
    const { data: catalogRows, error: catalogError } = await supabase
      .from('achievements')
      .select('id,slug')
      .in('slug', targetSlugs);

    if (catalogError) {
      return NextResponse.json(
        { error: 'catalog_error', details: catalogError.message },
        { status: 500 }
      );
    }

    const slugMap = (catalogRows ?? []).reduce<Record<string, string>>((acc, row) => {
      acc[row.slug] = row.id;
      return acc;
    }, {});

    const inserts = targetSlugs
      .map((slug) => slugMap[slug])
      .filter((id): id is string => Boolean(id))
      .map((achievementId) => ({
        user_id: userId,
        achievement_id: achievementId,
      }));

    if (inserts.length > 0) {
      const { error: insertError } = await supabase
        .from('user_achievements')
        .upsert(inserts, { onConflict: 'user_id,achievement_id' });

      if (insertError) {
        return NextResponse.json(
          { error: 'award_error', details: insertError.message },
          { status: 500 }
        );
      }
    }
  }

  const { data: freshAchievements, error: refreshError } = await supabase
    .from('user_achievements')
    .select('*, achievement:achievements(*)')
    .eq('user_id', userId)
    .order('earned_at', { ascending: false });

  if (refreshError) {
    return NextResponse.json(
      { error: 'refresh_error', details: refreshError.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    achievements: freshAchievements ?? [],
    unlocked: targetSlugs,
  });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}
