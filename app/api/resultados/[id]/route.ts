import { NextRequest, NextResponse } from "next/server";
import { getResult } from "@/lib/store";

type Params = {
  id: string;
};

export async function GET(
  request: NextRequest,
  context: { params: Params }
) {
  const id = context.params.id;
  
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
