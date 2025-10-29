import { NextRequest, NextResponse } from "next/server";
import { authorizeAdmin } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authResult = await authorizeAdmin(request);

  if (!authResult.authorized) {
    return NextResponse.json(
      {
        authorized: false,
        error: authResult.message ?? "Acesso não autorizado.",
      },
      { status: authResult.status ?? 401 }
    );
  }

  return NextResponse.json({
    authorized: true,
    mode: authResult.mode,
  });
}
