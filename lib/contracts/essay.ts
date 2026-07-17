import { z } from 'zod';

export const competenceScoreSchema = z.union([
  z.literal(0),
  z.literal(40),
  z.literal(80),
  z.literal(120),
  z.literal(160),
  z.literal(200),
]);

export const essayCompetenceSchema = z.strictObject({
  nota: competenceScoreSchema,
  comentario: z.string().trim().min(20).max(2_000),
});

const feedbackListSchema = z.array(z.string().trim().min(5).max(500)).min(1).max(5);

export const essayAnalysisSchema = z.discriminatedUnion('status', [
  z.strictObject({
    status: z.literal('off_topic'),
    justification: z.string().trim().min(10).max(1_000),
  }),
  z.strictObject({
    status: z.literal('aligned'),
    justification: z.string().trim().min(10).max(1_000),
    competencia1: essayCompetenceSchema,
    competencia2: essayCompetenceSchema,
    competencia3: essayCompetenceSchema,
    competencia4: essayCompetenceSchema,
    competencia5: essayCompetenceSchema,
    feedbackGeral: z.string().trim().min(30).max(4_000),
    pontoFortes: feedbackListSchema,
    pontosAMelhorar: feedbackListSchema,
  }),
]);

export const themeGenerationSchema = z.strictObject({
  themes: z.array(
    z.strictObject({
      tema: z.string().trim().min(10).max(300),
      textoApoio1: z.string().trim().min(40).max(3_000),
      textoApoio2: z.string().trim().min(40).max(3_000),
    })
  ).min(1).max(6),
});

export const supportTextsSchema = z.strictObject({
  textoApoio1: z.string().trim().min(40).max(3_000),
  textoApoio2: z.string().trim().min(40).max(3_000),
});

export const essaySubmissionSchema = z.strictObject({
  submissionId: z.uuid(),
  redacao: z.string().trim().min(50).max(5_000),
  theme: z.discriminatedUnion('mode', [
    z.strictObject({ mode: z.literal('generated'), id: z.uuid() }),
    z.strictObject({ mode: z.literal('manual'), tema: z.string().trim().min(5).max(300) }),
  ]),
});

export const generatedThemeResponseSchema = z.strictObject({
  themeId: z.uuid(),
  tema: z.string().trim().min(10).max(300),
  textoApoio1: z.string().trim().min(40).max(3_000),
  textoApoio2: z.string().trim().min(40).max(3_000),
});

export const essayCorrectionResponseSchema = z.strictObject({ id: z.uuid() });

export type EssayCompetence = z.infer<typeof essayCompetenceSchema>;

export type EssayResult = {
  id: string;
  nota: number;
  competencia1: EssayCompetence;
  competencia2: EssayCompetence;
  competencia3: EssayCompetence;
  competencia4: EssayCompetence;
  competencia5: EssayCompetence;
  feedbackGeral: string;
  pontoFortes: string[];
  pontosAMelhorar: string[];
  redacaoOriginal: string;
  createdAt: string;
  origem: 'IA' | 'Simulação';
  tema?: string;
  textoApoio1?: string;
  textoApoio2?: string;
};

export type GeneratedTheme = {
  id: string;
  tema: string;
  textoApoio1: string;
  textoApoio2: string;
};

export function calculateEssayScore(
  analysis: Extract<z.infer<typeof essayAnalysisSchema>, { status: 'aligned' }>
): number {
  return (
    analysis.competencia1.nota +
    analysis.competencia2.nota +
    analysis.competencia3.nota +
    analysis.competencia4.nota +
    analysis.competencia5.nota
  );
}
