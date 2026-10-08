import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';
import type { essaySubmissionSchema, GeneratedTheme } from '@/lib/contracts/essay';
import {
  claimSharedTheme,
  getGeneratedTheme,
  getRecentEssayThemeTitles,
  upsertGeneratedThemes,
} from '@/lib/db/repositories/essays';
import type { UserAiRuntime } from '@/lib/server/ai/provider';
import type { Database } from '@/types/supabase';
import { generateSupportTexts, generateThemeBatch } from './ai';
import { EssayServiceError } from './errors';

export type EssayThemeInput = z.infer<typeof essaySubmissionSchema>['theme'];
export type EssayThemeSnapshot = Omit<GeneratedTheme, 'id'>;

export async function createGeneratedTheme(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  userId: string
): Promise<{ theme: GeneratedTheme; provider?: string }> {
  const privateThemes = runtime.subscription.hasMaxAccess;
  if (!privateThemes) {
    const claimed = await claimSharedTheme(client, userId);
    if (claimed) return { theme: claimed };
  }

  const recentThemes = await getRecentEssayThemeTitles(client, userId);
  const generated = await generateThemeBatch(runtime, {
    count: privateThemes ? 1 : 4,
    excludedThemes: recentThemes,
  });
  const canonical = await upsertGeneratedThemes(client, {
    userId,
    privateThemes,
    themes: generated.data.themes,
  });

  const theme = privateThemes ? canonical[0] : await claimSharedTheme(client, userId);
  if (!theme) {
    throw new EssayServiceError('unavailable', 'Nenhum tema persistido está disponível.');
  }
  return { theme, provider: generated.provider };
}

export async function resolveEssayTheme(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  userId: string,
  input: EssayThemeInput
): Promise<EssayThemeSnapshot> {
  if (input.mode === 'generated') {
    const theme = await getGeneratedTheme(client, input.id, userId);
    if (!theme) throw new EssayServiceError('theme_not_found', 'Tema gerado não encontrado.');
    return theme;
  }

  const support = await generateSupportTexts(runtime, input.tema);
  return { tema: input.tema, ...support.data };
}
