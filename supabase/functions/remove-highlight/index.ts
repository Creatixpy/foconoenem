import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";

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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY devem estar definidos.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function authorize(request: Request): Promise<Authorized> {
  const url = new URL(request.url);
  if (ADMIN_CRON_SECRET) {
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
      return { authorized: false, status: 403, message: "Usuário sem permissão para gerenciar destaques." };
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
    },
    ...init,
  });
}

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  const auth = await authorize(request);
  if (!auth.authorized) {
    return jsonResponse({ error: auth.message }, { status: auth.status });
  }

  try {
    const payload = (await request.json()) as { id?: string } | null;
    const id = payload?.id;

    if (!id || typeof id !== "string") {
      return jsonResponse({ error: "ID não fornecido." }, { status: 400 });
    }

    const { error } = await supabase
      .from("noticias")
      .update({ destaque: false })
      .eq("id", id);

    if (error) {
      console.error("Erro ao remover destaque:", error);
      return jsonResponse({ error: "Erro ao remover destaque." }, { status: 500 });
    }

    return jsonResponse({ success: true, message: "Destaque removido com sucesso." });
  } catch (error) {
    console.error("Erro na edge function remove-highlight:", error);
    return jsonResponse(
      {
        error: "Erro interno do servidor.",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
});
