import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUserId, recalculateContaStatistics } from '@/lib/server/conta';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const originError = ensureTrustedOrigin(request);
        if (originError) {
            return originError;
        }

        const userId = await getAuthenticatedUserId();

        if (!userId) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const data = await recalculateContaStatistics(userId);
        return NextResponse.json({ success: true, data });
    } catch (error) {
        console.error('Erro ao recalcular estatísticas:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
