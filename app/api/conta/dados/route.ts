import { NextResponse } from 'next/server';
import { getAuthenticatedUserId, fetchContaData } from '@/lib/server/conta';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const userId = await getAuthenticatedUserId();

        if (!userId) {
            return NextResponse.json(
                { error: 'Não autenticado' },
                { status: 401 }
            );
        }

        const data = await fetchContaData(userId);
        return NextResponse.json(data);
    } catch (error) {
        console.error('Erro ao buscar dados da conta:', error);
        return NextResponse.json(
            { error: 'Erro interno do servidor' },
            { status: 500 }
        );
    }
}
