"use strict";

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ALLOWED_ORIGINS = (Deno.env.get("COMMUNITY_ALLOWED_ORIGINS") ?? "").split(",").map((item) => item.trim()).filter(Boolean);

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY precisam estar configuradas.");
}

type AwardContext = {
  total_redacoes: number | null;
  total_questoes_respondidas: number | null;
  media_nota_redacao: number | null;
  comment_count: number;
};

type AchievementRow = {
  id: string;
  slug: string;
};

type OwnedAchievementRow = {
  achievement: { slug: string | null } | null;
};

type UserAchievementRecord = {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  metadata: Record<string, unknown> | null;
  achievement: Record<string, unknown> | null;
};

const ACHIEVEMENT_SLUGS = ["primeira_redacao", "maratona_questoes", "nota_mil", "mentor_comunitario"] as const;
type AchievementSlug = (typeof ACHIEVEMENT_SLUGS)[number];

const checkConditions = (context: AwardContext): Record<AchievementSlug, boolean> => ({
  primeira_redacao: (context.total_redacoes ?? 0) >= 1,
  maratona_questoes: (context.total_questoes_respondidas ?? 0) >= 50,
  nota_mil: (context.media_nota_redacao ?? 0) >= 900,
  mentor_comunitario: context.comment_count >= 5,
});

const resolveOrigin = (origin: string | null) => {
  if (!origin) {
    return ALLOWED_ORIGINS[0] ?? "*";
  }
  if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes("*") || ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return ALLOWED_ORIGINS[0];
};

const buildCorsHeaders = (origin: string | null) => {
  const allowedOrigin = resolveOrigin(origin);
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, content-type",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };
};

const jsonResponse = (payload: unknown, status = 200, origin: string | null = null) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...buildCorsHeaders(origin),
    },
  });

Deno.serve(async (request: Request) => {
  const origin = request.headers.get("origin");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(origin),
    });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "method_not_allowed" }, 405, origin);
  }

  const authHeader = request.headers.get("Authorization") ?? request.headers.get("authorization") ?? "";
  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) {
    return jsonResponse({ error: "missing_token" }, 401, origin);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  const { data: userResult, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userResult?.user) {
    return jsonResponse({ error: "invalid_token", details: userError?.message }, 401, origin);
  }

  const userId = userResult.user.id;

  const [{ data: stats, error: statsError }, { count: commentCount = 0, error: commentsError }] = await Promise.all([
    supabase
      .from("user_statistics")
      .select("total_redacoes,total_questoes_respondidas,media_nota_redacao")
      .eq("user_id", userId)
      .single(),
    supabase.from("community_comments").select("*", { head: true, count: "exact" }).eq("user_id", userId),
  ]);

  if (statsError || commentsError) {
    return jsonResponse({ error: "statistics_error", details: statsError?.message ?? commentsError?.message }, 500, origin);
  }

  const context: AwardContext = {
    total_redacoes: stats?.total_redacoes ?? 0,
    total_questoes_respondidas: stats?.total_questoes_respondidas ?? 0,
    media_nota_redacao: stats?.media_nota_redacao ?? 0,
    comment_count: commentCount ?? 0,
  };

  const { data: existingAchievements, error: existingError } = await supabase
    .from("user_achievements")
    .select("achievement:achievements(slug)")
    .eq("user_id", userId);

  if (existingError) {
    return jsonResponse({ error: "load_achievements_failed", details: existingError.message }, 500, origin);
  }

  const existingRows = (existingAchievements ?? []) as unknown as OwnedAchievementRow[];

  const ownedSlugs = new Set<string>(
    existingRows
      .map((entry) => entry.achievement?.slug)
      .filter((slug): slug is string => Boolean(slug))
  );

  const conditions = checkConditions(context);
  const targetSlugs = ACHIEVEMENT_SLUGS.filter((slug) => conditions[slug] && !ownedSlugs.has(slug));

  if (targetSlugs.length > 0) {
    const { data: achievementRows, error: catalogError } = await supabase
      .from("achievements")
      .select("id,slug")
      .in("slug", targetSlugs);

    if (catalogError) {
      return jsonResponse({ error: "catalog_error", details: catalogError.message }, 500, origin);
    }

    const catalogRows = (achievementRows ?? []) as unknown as AchievementRow[];

    const slugMap = catalogRows.reduce<Record<string, string>>((acc, row) => {
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
      const { error: insertError } = await supabase.from("user_achievements").upsert(inserts, {
        onConflict: "user_id,achievement_id",
      });

      if (insertError) {
        return jsonResponse({ error: "award_error", details: insertError.message }, 500, origin);
      }
    }
  }

  const { data: freshAchievements, error: refreshError } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false });

  if (refreshError) {
    return jsonResponse({ error: "refresh_error", details: refreshError.message }, 500, origin);
  }

  const freshRows = (freshAchievements ?? []) as unknown as UserAchievementRecord[];

  return jsonResponse({
    achievements: freshRows,
    unlocked: targetSlugs,
  }, 200, origin);
});
