import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/db";

export async function GET() {
  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role não configurado." },
      { status: 500 }
    );
  }

  const { data, error } = await supabase
    .from("community_topics")
    .select("*")
    .order("title", { ascending: true });

  if (error) {
    console.error("Erro ao listar tópicos da comunidade:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os tópicos no momento." },
      { status: 500 }
    );
  }

  return NextResponse.json({ topics: data ?? [] });
}
