import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";
import { Groq } from "npm:groq-sdk";

type Authorized =
  | { authorized: true; mode: "user" | "cron"; email?: string }
  | { authorized: false; status: number; message: string };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ADMIN_ALLOWED_EMAILS = (Deno.env.get("ADMIN_ALLOWED_EMAILS") ?? "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const ADMIN_CRON_SECRET = Deno.env.get("ADMIN_CRON_SECRET") ?? "";
const ADMIN_ALLOWED_ORIGINS = (Deno.env.get("ADMIN_ALLOWED_ORIGINS") ?? "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY") ?? "";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-cron-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos.");
}

if (!GROQ_API_KEY) {
  console.warn("A edge function update-highlights foi inicializada sem GROQ_API_KEY.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function authorize(request: Request, options: { allowCron: boolean }): Promise<Authorized> {
  const url = new URL(request.url);
  if (options.allowCron && ADMIN_CRON_SECRET) {
    const cronSecret = request.headers.get("x-cron-secret") ?? url.searchParams.get("secret");
    if (cronSecret && cronSecret === ADMIN_CRON_SECRET) {
      return { authorized: true, mode: "cron" };
    }
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.toLowerCase().startsWith("bearer ")) {
    return { authorized: false, status: 401, message: "Token de acesso ausente." };
  }

  const token = authHeader.slice("bearer ".length).trim();
  if (!token) {
    return { authorized: false, status: 401, message: "Token de acesso inválido." };
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { authorized: false, status: 401, message: "Sessão inválida ou expirada." };
    }

    if (ADMIN_ALLOWED_EMAILS.length === 0) {
      return {
        authorized: false,
        status: 403,
        message: "ADMIN_ALLOWED_EMAILS não configurado.",
      };
    }

    const email = data.user.email?.toLowerCase();
    if (!email || !ADMIN_ALLOWED_EMAILS.includes(email)) {
      return { authorized: false, status: 403, message: "Usuário sem permissão para atualizar destaques." };
    }

    return { authorized: true, mode: "user", email };
  } catch (error) {
    console.error("Erro ao validar token administrativo:", error);
    return { authorized: false, status: 500, message: "Falha ao validar credenciais do administrador." };
  }
}

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...corsHeaders,
    },
    ...init,
  });
}

function resolveOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return "*";
  }

  if (ADMIN_ALLOWED_ORIGINS.length === 0) {
    return origin;
  }

  if (ADMIN_ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }

  return ADMIN_ALLOWED_ORIGINS[0];
}

async function isUpdateNeeded(): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("configuracoes")
      .select("valor")
      .eq("chave", "ultima_atualizacao_destaques")
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      console.error("Erro ao consultar ultima_atualizacao_destaques:", error);
      return true;
    }

    if (!data?.valor) {
      return true;
    }

    const ultima = new Date(data.valor);
    if (Number.isNaN(ultima.getTime())) {
      return true;
    }

    const horas = (Date.now() - ultima.getTime()) / (1000 * 60 * 60);
    return horas >= 24;
  } catch (error) {
    console.error("Erro ao verificar necessidade de atualização:", error);
    return true;
  }
}

async function atualizarTimestampAtualizacao() {
  try {
    const agora = new Date().toISOString();
    const { data } = await supabase
      .from("configuracoes")
      .select("id")
      .eq("chave", "ultima_atualizacao_destaques")
      .maybeSingle();

    if (data?.id) {
      await supabase.from("configuracoes").update({ valor: agora }).eq("id", data.id);
    } else {
      await supabase.from("configuracoes").insert({ chave: "ultima_atualizacao_destaques", valor: agora });
    }
  } catch (error) {
    console.error("Erro ao atualizar timestamp:", error);
  }
}

async function processAutomaticUpdate() {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 30);

  const { data: noticias, error: noticiasError } = await supabase
    .from("noticias")
    .select("id, titulo, resumo, conteudo, data_publicacao, tags")
    .gte("data_publicacao", dataLimite.toISOString())
    .order("data_publicacao", { ascending: false });

  if (noticiasError) {
    throw new Error(`Erro ao buscar notícias: ${noticiasError.message}`);
  }

  if (!noticias || noticias.length === 0) {
    return {
      status: "error" as const,
      message: "Nenhuma notícia encontrada para análise",
    };
  }

  if (!GROQ_API_KEY) {
    throw new Error("Groq API key não configurada.");
  }

  const groq = new Groq({ apiKey: GROQ_API_KEY });
  const noticiasSimpificadas = noticias.map((noticia) => ({
    id: noticia.id,
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    data: noticia.data_publicacao,
    tags: noticia.tags,
  }));

  const prompt = `
  Analise as seguintes notícias e selecione no máximo 5 para destaque na página inicial de um site educacional focado no ENEM.
  Escolha notícias que sejam mais relevantes para estudantes que estão se preparando para o ENEM,
  considerando atualidade, impacto educacional e interesse geral.

  Notícias para análise:
  ${JSON.stringify(noticiasSimpificadas)}

  Responda APENAS em formato JSON com um array de IDs das notícias selecionadas (máximo 5):
  {
    "destaques": ["id1", "id2", "id3"]
  }`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "openai/gpt-oss-120b",
    temperature: 0.3,
    max_tokens: 8050,
    top_p: 1,
    stream: false,
    response_format: { type: "json_object" },
  });

  const aiContent = response.choices?.[0]?.message?.content ?? "";
  let aiResult: unknown;

  try {
    aiResult = JSON.parse(aiContent);
  } catch (parseError) {
    console.error("Falha ao fazer parse direto do JSON:", parseError);
    const jsonMatch =
      aiContent.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
      aiContent.match(/(\{[\s\S]*\})/);

    if (!jsonMatch || !jsonMatch[1]) {
      throw new Error("Formato de resposta inválido da API.");
    }

    aiResult = JSON.parse(jsonMatch[1].trim());
  }

  if (
    !aiResult ||
    typeof aiResult !== "object" ||
    !Array.isArray((aiResult as { destaques?: unknown }).destaques)
  ) {
    throw new Error("Resposta da IA não contém array de destaques.");
  }

  const idsDestaque = (aiResult as { destaques: string[] }).destaques.slice(0, 5);
  if (idsDestaque.length === 0) {
    throw new Error("IA não selecionou nenhuma notícia para destaque.");
  }

  const { error: resetError } = await supabase
    .from("noticias")
    .update({ destaque: false })
    .eq("destaque", true);

  if (resetError) {
    throw new Error(`Erro ao resetar destaques: ${resetError.message}`);
  }

  const { error: updateError } = await supabase
    .from("noticias")
    .update({ destaque: true })
    .in("id", idsDestaque);

  if (updateError) {
    throw new Error(`Erro ao atualizar destaques: ${updateError.message}`);
  }

  await atualizarTimestampAtualizacao();

  return {
    status: "success" as const,
    message: "Destaques atualizados com sucesso",
    destaques: idsDestaque,
  };
}

Deno.serve(async (request) => {
  const origin = resolveOrigin(request);
  corsHeaders["Access-Control-Allow-Origin"] = origin;

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(request.url);
    const isAutomatic = url.searchParams.get("automatic") === "true";

    const auth = await authorize(request, { allowCron: isAutomatic });
    if (!auth.authorized) {
      return jsonResponse({ error: auth.message }, { status: auth.status });
    }

    if (isAutomatic) {
      const precisaAtualizar = await isUpdateNeeded();
      if (!precisaAtualizar) {
        return jsonResponse({
          status: "skipped",
          message: "Atualização de destaques não necessária. Menos de 24 horas desde a última atualização.",
        });
      }
    }

    const resultado = await processAutomaticUpdate();
    return jsonResponse(resultado);
  } catch (error) {
    console.error("Erro na edge function update-highlights:", error);
    return jsonResponse(
      {
        error: "Erro ao atualizar destaques",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
});
