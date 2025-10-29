import { NextRequest, NextResponse } from "next/server";

const baseFunctionUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/correct-essay`
  : null;

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function buildHeaders(request: NextRequest): Headers {
  const headers = new Headers();

  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  }

  if (anonKey) {
    headers.set("apikey", anonKey);
    if (!authHeader) {
      headers.set("authorization", `Bearer ${anonKey}`);
    }
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    headers.set("x-forwarded-for", forwardedFor);
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    headers.set("x-real-ip", realIp);
  }

  const userAgent = request.headers.get("user-agent");
  if (userAgent) {
    headers.set("user-agent", userAgent);
  }

  return headers;
}

type ResultRouteParams = {
  id?: string | string[];
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<ResultRouteParams> }
) {
  if (!baseFunctionUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL não configurada." },
      { status: 500 }
    );
  }

  const params = await context.params;
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "ID não fornecido" }, { status: 400 });
  }

  const normalizedId = Array.isArray(id) ? id[0] : id;
  if (!normalizedId) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 });
  }

  const url = new URL(baseFunctionUrl);
  url.searchParams.set("id", normalizedId);

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: buildHeaders(request),
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}
