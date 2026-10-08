import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import {
  claimEssaySubmission,
  completeEssaySubmission,
  failEssaySubmission,
  type EssaySubmissionIdentity,
} from '@/lib/db/repositories/essays';
import type { Database } from '@/types/supabase';
import type { UserAiRuntime } from '@/lib/server/ai/provider';
import { StudyAccessError } from '@/lib/server/study-access';
import { analyzeEssay } from './ai';
import { EssayServiceError } from './errors';
import { createEssayInputFingerprint } from './fingerprint';
import { createEssayResultSnapshot } from './result';
import { resolveEssayTheme, type EssayThemeInput } from './themes';

export type EssayCorrectionOutcome =
  | { state: 'completed'; resultId: string; score?: number; provider?: string }
  | { state: 'off_topic'; justification: string }
  | { state: 'in_progress' }
  | { state: 'conflict' };

type EssayCorrectionInput = Pick<EssaySubmissionIdentity, 'submissionId' | 'userId'> & {
  essay: string;
  theme: EssayThemeInput;
};

export async function correctEssay(
  client: SupabaseClient<Database>,
  loadRuntime: () => Promise<UserAiRuntime>,
  input: EssayCorrectionInput
): Promise<EssayCorrectionOutcome> {
  const identity: EssaySubmissionIdentity = {
    submissionId: input.submissionId,
    userId: input.userId,
    inputFingerprint: createEssayInputFingerprint(input),
  };
  const claim = await claimEssaySubmission(client, identity);

  if (claim.state !== 'claimed') return claim;

  try {
    const runtime = await loadRuntime();
    const theme = await resolveEssayTheme(client, runtime, input.userId, input.theme);
    const analysis = await analyzeEssay(runtime, {
      essay: input.essay,
      theme: theme.tema,
      supportOne: theme.textoApoio1,
      supportTwo: theme.textoApoio2,
    });

    if (analysis.data.status === 'off_topic') {
      await failEssaySubmission(client, {
        ...identity,
        errorMessage: `off_topic:${analysis.data.justification}`,
      });
      return { state: 'off_topic', justification: analysis.data.justification };
    }

    const persisted = await completeEssaySubmission(client, {
      ...identity,
      result: createEssayResultSnapshot(analysis.data, input.essay, theme),
    });

    return {
      state: 'completed',
      resultId: persisted.id,
      score: persisted.nota,
      provider: analysis.provider,
    };
  } catch (error) {
    await failEssaySubmission(client, {
      ...identity,
      errorMessage: error instanceof Error ? error.message : 'unknown_error',
    }).catch((failure) => console.error('Falha ao liberar claim de redação:', failure));
    throw error instanceof EssayServiceError || error instanceof StudyAccessError
      ? error
      : new EssayServiceError(
          'unavailable',
          error instanceof Error ? error.message : 'Correção indisponível.'
        );
  }
}
