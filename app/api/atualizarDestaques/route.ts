import { NextRequest, NextResponse } from "next/server";

const functionBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-highlights`
  : null;

const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const cronSecret = process.env.ADMIN_CRON_SECRET;

export async function GET(request: NextRequest) {
  if (!functionBaseUrl) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_SUPABASE_URL não configurada." },
      { status: 500 }
    );
  }

  const targetUrl = new URL(functionBaseUrl);
  const incomingUrl = request.nextUrl;
  incomingUrl.searchParams.forEach((value, key) => {
    targetUrl.searchParams.set(key, value);
  });

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

  const response = await fetch(targetUrl.toString(), {
    method: "GET",
    headers,
  });

  const body = await response.text();

  return new NextResponse(body, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") ?? "application/json; charset=utf-8",
    },
  });
}
