import { NextResponse } from 'next/server';
import { getBrazilNow } from '@/lib/server/brazil-time';

export async function GET() {
  try {
    const { now, source, usedFallback } = await getBrazilNow();

    return NextResponse.json({
      datetime: now.toISOString(),
      source,
      fallback: usedFallback,
    });
  } catch (error) {
    console.error('Erro ao obter horário do Brasil:', error);

    return NextResponse.json(
      {
        datetime: new Date().toISOString(),
        source: 'local',
        fallback: true,
      },
      { status: 200 }
    );
  }
}
