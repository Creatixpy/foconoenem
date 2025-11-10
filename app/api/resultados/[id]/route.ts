import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { trackEvent } from '@/lib/server/analytics';
import { resolveRequestUser } from '@/lib/server/auth-request';

type EssayRow = Database['public']['Tables']['essay_results']['Row'];

function normalizeEssayRow(row: EssayRow) {
  return {
    id: row.id,
    nota: row.nota,
    competencia1: row.competencia1,
    competencia2: row.competencia2,
    competencia3: row.competencia3,
    competencia4: row.competencia4,
    competencia5: row.competencia5,
    feedbackGeral: row.feedback_geral,
    pontoFortes: (row.ponto_fortes as string[] | null) ?? [],
    pontosAMelhorar: (row.pontos_a_melhorar as string[] | null) ?? [],
    redacaoOriginal: row.redacao_original,
    createdAt: row.created_at,
    origem: row.origem,
    tema: row.tema ?? undefined,
    textoApoio1: row.texto_apoio1 ?? undefined,
    textoApoio2: row.texto_apoio2 ?? undefined,
  };
}

async function getResult(client: SupabaseClient<Database>, id: string, userId: string) {
  const { data, error } = await client
    .from('essay_results')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Erro ao buscar resultado de redação:', error);
    return null;
  }

  if (!data) {
    return null;
  }

  return normalizeEssayRow(data as EssayRow);
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id?: string | string[] }> }
) {
  const auth = await resolveRequestUser(request);
  if ('error' in auth) {
    return auth.error;
  }

  const supabase = auth.supabase as SupabaseClient<Database>;
  const userId = auth.userId;

  const params = await context.params;
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  if (!id) {
    return NextResponse.json({ error: 'ID não fornecido' }, { status: 400 });
  }

  const result = await getResult(supabase as SupabaseClient<Database>, id, userId);
  if (!result) {
    return NextResponse.json({ error: 'Resultado não encontrado' }, { status: 404 });
  }

  await trackEvent({
    eventType: 'essay_viewed',
    metadata: { essay_id: id, from: 'resultados-route' },
    userIp: request.headers.get('x-forwarded-for') ?? undefined,
    userAgent: request.headers.get('user-agent') ?? undefined,
    userId,
  });

  return NextResponse.json({ result });
}
