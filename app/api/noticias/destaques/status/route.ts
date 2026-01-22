import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { createAdminClient } from '@/lib/db/server';

export async function GET(request: NextRequest) {
  const authResult = await authorizeAdmin(request);

  if (!authResult.authorized) {
    return NextResponse.json(
      {
        error: authResult.message ?? "Acesso não autorizado.",
      },
      { status: authResult.status ?? 401 }
    );
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase service role não configurado." },
      { status: 500 }
    );
  }

  try {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("chave", "ultima_atualizacao_destaques")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw error;
    }

    if (!data?.valor) {
      return NextResponse.json({
        ultimaAtualizacao: null,
        proxima: null,
        status: "never",
      });
    }

    const ultimaAtualizacao = new Date(data.valor);
    const proximaAtualizacao = new Date(ultimaAtualizacao);
    proximaAtualizacao.setHours(proximaAtualizacao.getHours() + 24);

    const agora = new Date();

    return NextResponse.json({
      ultimaAtualizacao: ultimaAtualizacao.toISOString(),
      proxima: proximaAtualizacao.toISOString(),
      status: agora > proximaAtualizacao ? "pending" : "updated",
    });
  } catch (error) {
    console.error("Erro ao verificar status dos destaques:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar o status dos destaques." },
      { status: 500 }
    );
  }
}
