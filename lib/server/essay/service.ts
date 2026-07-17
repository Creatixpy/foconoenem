import 'server-only';

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import {
  calculateEssayScore,
  type EssayResult,
  type GeneratedTheme,
} from '@/lib/contracts/essay';
import {
  claimEssaySubmission,
  claimSharedTheme,
  completeEssaySubmission,
  failEssaySubmission,
  getGeneratedTheme,
  getRecentEssayThemeTitles,
  upsertGeneratedThemes,
} from '@/lib/db/repositories/essays';
import type { Database } from '@/types/supabase';
import type { UserAiRuntime } from '@/lib/server/ai/provider';
import { analyzeEssay, generateSupportTexts, generateThemeBatch } from './ai';
import { createEssayInputFingerprint } from './fingerprint';

export type EssayCorrectionOutcome =
  | { state: 'completed'; resultId: string; score?: number; provider?: string }
  | { state: 'off_topic'; justification: string }
  | { state: 'in_progress' }
  | { state: 'conflict' };

export class EssayServiceError extends Error {
  constructor(public readonly kind: 'theme_not_found' | 'unavailable', message: string) {
    super(message);
    this.name = 'EssayServiceError';
  }
}

export async function createGeneratedTheme(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  userId: string
): Promise<{ theme: GeneratedTheme; provider?: string }> {
  if (!runtime.subscription.hasMaxAccess) {
    const claimed = await claimSharedTheme(client, userId);
    if (claimed) return { theme: claimed };
  }

  const recentThemes = await getRecentEssayThemeTitles(client, userId);
  const requestedCount = runtime.subscription.hasMaxAccess ? 1 : 4;
  const generated = await generateThemeBatch(runtime, {
    count: requestedCount,
    excludedThemes: recentThemes,
  });
  const canonical = await upsertGeneratedThemes(client, {
    userId,
    privateThemes: runtime.subscription.hasMaxAccess,
    themes: generated.data.themes.map((theme) => ({ ...theme })),
  });

  if (runtime.subscription.hasMaxAccess) {
    const theme = canonical[0];
    if (!theme) throw new Error('Nenhum tema Max foi persistido.');
    return { theme, provider: generated.provider };
  }

  const claimed = await claimSharedTheme(client, userId);
  if (!claimed) throw new Error('Nenhum tema compartilhado está disponível.');
  return { theme: claimed, provider: generated.provider };
}

async function resolveTheme(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  userId: string,
  themeInput: { mode: 'generated'; id: string } | { mode: 'manual'; tema: string }
): Promise<GeneratedTheme> {
  if (themeInput.mode === 'generated') {
    const theme = await getGeneratedTheme(client, themeInput.id, userId);
    if (!theme) throw new EssayServiceError('theme_not_found', 'Tema gerado não encontrado.');
    return theme;
  }

  const support = await generateSupportTexts(runtime, themeInput.tema);
  return {
    id: randomUUID(),
    tema: themeInput.tema,
    textoApoio1: support.data.textoApoio1,
    textoApoio2: support.data.textoApoio2,
  };
}

export async function correctEssay(
  client: SupabaseClient<Database>,
  runtime: UserAiRuntime,
  input: {
    submissionId: string;
    userId: string;
    essay: string;
    theme: { mode: 'generated'; id: string } | { mode: 'manual'; tema: string };
  }
): Promise<EssayCorrectionOutcome> {
  const inputFingerprint = createEssayInputFingerprint(input);
  const claim = await claimEssaySubmission(client, {
    submissionId: input.submissionId,
    userId: input.userId,
    inputFingerprint,
  });

  if (claim.state === 'completed') {
    return { state: 'completed', resultId: claim.resultId };
  }
  if (
    claim.state === 'in_progress' ||
    claim.state === 'conflict' ||
    claim.state === 'off_topic'
  ) {
    return claim;
  }

  try {
    const theme = await resolveTheme(client, runtime, input.userId, input.theme);
    const analysis = await analyzeEssay(runtime, {
      essay: input.essay,
      theme: theme.tema,
      supportOne: theme.textoApoio1,
      supportTwo: theme.textoApoio2,
    });

    if (analysis.data.status === 'off_topic') {
      await failEssaySubmission(client, {
        submissionId: input.submissionId,
        userId: input.userId,
        inputFingerprint,
        errorMessage: `off_topic:${analysis.data.justification}`,
      });
      return { state: 'off_topic', justification: analysis.data.justification };
    }

    const result: Omit<EssayResult, 'createdAt' | 'origem'> = {
      id: randomUUID(),
      nota: calculateEssayScore(analysis.data),
      competencia1: analysis.data.competencia1,
      competencia2: analysis.data.competencia2,
      competencia3: analysis.data.competencia3,
      competencia4: analysis.data.competencia4,
      competencia5: analysis.data.competencia5,
      feedbackGeral: analysis.data.feedbackGeral,
      pontoFortes: analysis.data.pontoFortes,
      pontosAMelhorar: analysis.data.pontosAMelhorar,
      redacaoOriginal: input.essay,
      tema: theme.tema,
      textoApoio1: theme.textoApoio1,
      textoApoio2: theme.textoApoio2,
    };

    const persisted = await completeEssaySubmission(client, {
      submissionId: input.submissionId,
      userId: input.userId,
      inputFingerprint,
      result,
    });

    return {
      state: 'completed',
      resultId: persisted.id,
      score: persisted.nota,
      provider: analysis.provider,
    };
  } catch (error) {
    await failEssaySubmission(client, {
      submissionId: input.submissionId,
      userId: input.userId,
      inputFingerprint,
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    }).catch((failure) => console.error('Falha ao liberar claim de redação:', failure));
    throw error instanceof EssayServiceError
      ? error
      : new EssayServiceError(
          'unavailable',
          error instanceof Error ? error.message : 'Correção indisponível.'
        );
  }
}
