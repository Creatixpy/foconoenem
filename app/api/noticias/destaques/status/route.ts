import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";
import { createAdminClient } from '@/lib/db/server';
import { getHighlightsStatus } from '@/lib/server/news-highlights';

export async function GET(request: NextRequest) {
  const authResult = await authorizeAdmin(request);

  if (!authResult.authorized) {
    return NextResponse.json(
      { error: "Acesso não autorizado." },
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
    return NextResponse.json(await getHighlightsStatus(supabase));
  } catch (error) {
    console.error("Erro ao verificar status dos destaques:", error);
    return NextResponse.json(
      { error: "Não foi possível verificar o status dos destaques." },
      { status: 500 }
    );
  }
}
