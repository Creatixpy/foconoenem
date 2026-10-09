import 'server-only';

import { randomUUID } from 'node:crypto';
import type { z } from 'zod';
import { calculateEssayScore, type essayAnalysisSchema } from '@/lib/contracts/essay';
import type { EssayResultSnapshot } from '@/lib/db/repositories/essays';
import type { EssayThemeSnapshot } from './themes';

type AlignedEssayAnalysis = Extract<z.infer<typeof essayAnalysisSchema>, { status: 'aligned' }>;

export function createEssayResultSnapshot(
  analysis: AlignedEssayAnalysis,
  essay: string,
  theme: EssayThemeSnapshot
): EssayResultSnapshot {
  return {
    id: randomUUID(),
    nota: calculateEssayScore(analysis),
    competencia1: analysis.competencia1,
    competencia2: analysis.competencia2,
    competencia3: analysis.competencia3,
    competencia4: analysis.competencia4,
    competencia5: analysis.competencia5,
    feedbackGeral: analysis.feedbackGeral,
    pontoFortes: analysis.pontoFortes,
    pontosAMelhorar: analysis.pontosAMelhorar,
    redacaoOriginal: essay,
    tema: theme.tema,
    textoApoio1: theme.textoApoio1,
    textoApoio2: theme.textoApoio2,
  };
}
