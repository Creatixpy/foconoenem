import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0?target=deno";

type Authorized =
  | { authorized: true; mode: "cron" | "user" }
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
      return { authorized: false, status: 403, message: "Usuário sem permissão para executar manutenção." };
    }

    return { authorized: true, mode: "user" };
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

async function cleanupCachedThemes() {
  const threshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("cached_themes")
    .delete()
    .lt("created_at", threshold)
    .select("id", { count: "exact" });

  if (error) {
    throw new Error(`Erro ao limpar cached_themes: ${error.message}`);
  }

  return data?.length ?? 0;
}

async function cleanupRateLimits() {
  const threshold = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("rate_limits")
    .delete()
    .lt("window_start", threshold)
    .select("id", { count: "exact" });

  if (error) {
    throw new Error(`Erro ao limpar rate_limits: ${error.message}`);
  }

  return data?.length ?? 0;
}

async function cleanupAnalytics() {
  const threshold = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("analytics_events")
    .delete()
    .lt("created_at", threshold)
    .select("id", { count: "exact" });

  if (error) {
    throw new Error(`Erro ao limpar analytics_events: ${error.message}`);
  }

  return data?.length ?? 0;
}

Deno.serve(async (request) => {
  if (request.method !== "POST" && request.method !== "GET") {
    return jsonResponse({ error: "Método não permitido." }, { status: 405 });
  }

  const auth = await authorize(request);
  if (!auth.authorized) {
    return jsonResponse({ error: auth.message }, { status: auth.status });
  }

  try {
    const [themes, rateLimits, analytics] = await Promise.all([
      cleanupCachedThemes().catch((error) => ({ error })),
      cleanupRateLimits().catch((error) => ({ error })),
      cleanupAnalytics().catch((error) => ({ error })),
    ]);

    const result: Record<string, unknown> = {
      status: "completed",
      deleted: {
        cached_themes: typeof themes === "number" ? themes : 0,
        rate_limits: typeof rateLimits === "number" ? rateLimits : 0,
        analytics_events: typeof analytics === "number" ? analytics : 0,
      },
      errors: [] as string[],
    };

    if (typeof themes !== "number" && themes?.error) {
      result.errors.push(themes.error instanceof Error ? themes.error.message : String(themes.error));
    }

    if (typeof rateLimits !== "number" && rateLimits?.error) {
      result.errors.push(rateLimits.error instanceof Error ? rateLimits.error.message : String(rateLimits.error));
    }

    if (typeof analytics !== "number" && analytics?.error) {
      result.errors.push(analytics.error instanceof Error ? analytics.error.message : String(analytics.error));
    }

    return jsonResponse(result);
  } catch (error) {
    console.error("Erro na edge function maintenance-cleanup:", error);
    return jsonResponse(
      {
        error: "Erro ao executar manutenção.",
        message: error instanceof Error ? error.message : "Erro desconhecido.",
      },
      { status: 500 }
    );
  }
});
