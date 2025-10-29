import { NextRequest, NextResponse } from "next/server";

const functionBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/remove-highlight`
  : null;

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cronSecret = process.env.ADMIN_CRON_SECRET;

export async function POST(request: NextRequest) {
  if (!functionBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL não configurada." },
      { status: 500 }
    );
  }

  const headers = new Headers();
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers.set("authorization", authHeader);
  } else if (anonKey) {
    headers.set("authorization", `Bearer ${anonKey}`);
  }

  const incomingCronSecret = request.headers.get("x-cron-secret");
  if (incomingCronSecret) {
    headers.set("x-cron-secret", incomingCronSecret);
  } else if (cronSecret) {
    headers.set("x-cron-secret", cronSecret);
  }

  const body = await request.text();
  if (!headers.has("content-type")) {
    headers.set("content-type", request.headers.get("content-type") ?? "application/json");
  }

  const response = await fetch(functionBaseUrl, {
    method: "POST",
    headers,
    body,
  });

  const responseBody = await response.text();

  return new NextResponse(responseBody, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}
