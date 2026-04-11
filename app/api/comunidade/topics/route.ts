import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/db/server";

export async function GET() {
  const supabase = await createServerClient();

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
