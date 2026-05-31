'use server';

import { toSubscriptionSummary } from '@/lib/server/subscriptions';
import { createAdminClient, createServerClient } from '@/lib/db/server';

/**
 * Gets the authenticated user's ID from cookie session
 */
async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const supabase = await createServerClient();
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id || null;
    } catch (error) {
        console.error('Erro ao obter usuário autenticado:', error);
        return null;
    }
}

/**
 * Fetches user statistics and essays
 */
export async function fetchContaData(userId: string) {
    const supabase = createAdminClient();
    if (!supabase) {
        throw new Error('Supabase admin não configurado');
    }

    const [statsResponse, essaysResponse, subscriptionResponse] = await Promise.all([
        supabase
            .from('user_statistics')
            .select('*')
            .eq('user_id', userId)
            .single(),
        supabase
            .from('essay_results')
            .select('id, nota, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10),
        supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle(),
    ]);

    // Parse numeric fields
    const statistics = statsResponse.data;
    if (statistics) {
        const numericFields = [
            'media_nota_redacao',
            'media_competencia1',
            'media_competencia2',
            'media_competencia3',
            'media_competencia4',
            'media_competencia5',
            'taxa_acerto',
        ] as const;

        for (const field of numericFields) {
            const value = statistics[field];
            if (typeof value === 'string') {
                (statistics as Record<string, unknown>)[field] = parseFloat(value) || null;
            }
        }
    }

    if (subscriptionResponse.error) {
        throw subscriptionResponse.error;
    }

    return {
        statistics: statistics || null,
        essays: essaysResponse.data || [],
        subscription: toSubscriptionSummary(subscriptionResponse.data ?? null),
    };
}

/**
 * Recalculates user statistics
 */
export async function recalculateContaStatistics(userId: string) {
    const supabase = createAdminClient();
    if (!supabase) {
        throw new Error('Supabase admin não configurado');
    }

    const { data, error } = await supabase.rpc('recalculate_user_statistics', {
        target_user_id: userId,
    });

    if (error) {
        throw error;
    }

    return data;
}

export { getAuthenticatedUserId };
