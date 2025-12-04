'use server';

import { createAdminClient } from '@/lib/db';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Gets the authenticated user's ID from cookie session
 */
async function getAuthenticatedUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return null;
        }

        // Get access token from cookies
        const accessToken = cookieStore.get('sb-access-token')?.value
            || cookieStore.get(`sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`)?.value;

        if (!accessToken) {
            // Try to parse the auth token cookie
            const authCookieName = cookieStore.getAll().find(c => c.name.includes('auth-token'))?.name;
            if (authCookieName) {
                const authCookie = cookieStore.get(authCookieName);
                if (authCookie?.value) {
                    try {
                        const parsed = JSON.parse(authCookie.value);
                        if (parsed?.access_token) {
                            const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
                                global: {
                                    headers: {
                                        Authorization: `Bearer ${parsed.access_token}`,
                                    },
                                },
                            });
                            const { data: { user } } = await client.auth.getUser();
                            return user?.id || null;
                        }
                    } catch {
                        // Invalid JSON, continue
                    }
                }
            }
            return null;
        }

        const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            },
        });

        const { data: { user } } = await client.auth.getUser();
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

    const [statsResponse, essaysResponse] = await Promise.all([
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
    ]);

    // Parse numeric fields
    let statistics = statsResponse.data;
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

    return {
        statistics: statistics || null,
        essays: essaysResponse.data || [],
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
