import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from '@/lib/db/server';
import type { Database } from "@/types/supabase";

type CommunityCommentRow = Database["public"]["Tables"]["community_comments"]["Row"];

export async function GET(request: NextRequest) {
  const topicId = request.nextUrl.searchParams.get("topicId");
  const limitParam = request.nextUrl.searchParams.get("limit");
  const limit = Number.isFinite(Number(limitParam)) && Number(limitParam) > 0 ? Number(limitParam) : 25;

  if (!topicId) {
    return NextResponse.json({ error: "topicId obrigatório" }, { status: 400 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role não configurado." },
      { status: 500 }
    );
  }

  const { data: posts, error: postsError } = await supabase
    .from("community_posts")
    .select("*")
    .eq("topic_id", topicId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (postsError) {
    console.error("Erro ao buscar posts da comunidade:", postsError);
    return NextResponse.json({ error: "Falha ao buscar posts." }, { status: 500 });
  }

  const postIds = (posts ?? []).map((post) => post.id);
  let comments: CommunityCommentRow[] = [];

  if (postIds.length > 0) {
    const { data: commentsData, error: commentsError } = await supabase
      .from("community_comments")
      .select("*")
      .in("post_id", postIds)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Erro ao buscar comentários da comunidade:", commentsError);
      return NextResponse.json({ error: "Falha ao buscar comentários." }, { status: 500 });
    }

    comments = commentsData ?? [];
  }

  const commentsByPost = comments.reduce<Record<string, CommunityCommentRow[]>>((accumulator, comment) => {
    const postId = comment.post_id;
    accumulator[postId] = accumulator[postId] ? [...accumulator[postId], comment] : [comment];
    return accumulator;
  }, {});

  const threads = (posts ?? []).map((post) => ({
    ...post,
    comments: commentsByPost[post.id] ?? [],
  }));

  return NextResponse.json({ topicId, threads });
}
