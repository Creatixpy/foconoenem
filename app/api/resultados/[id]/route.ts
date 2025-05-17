import { NextRequest, NextResponse } from "next/server";
import { getResult } from "@/lib/store";

type Params = { params: { id: string } };

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  const id = params.id;
  
  if (!id) {
    return NextResponse.json(
      { error: "ID não fornecido" },
      { status: 400 }
    );
  }
  
  const result = getResult(id);
  
  if (!result) {
    return NextResponse.json(
      { error: "Resultado não encontrado" },
      { status: 404 }
    );
  }
  
  return NextResponse.json({ result });
}
