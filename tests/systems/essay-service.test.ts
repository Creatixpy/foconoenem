import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';
import type { UserAiRuntime } from '../../lib/server/ai/provider';
import {
  claimEssaySubmission,
  claimSharedTheme,
  completeEssaySubmission,
  failEssaySubmission,
  getGeneratedTheme,
  getRecentEssayThemeTitles,
  upsertGeneratedThemes,
  type EssaySubmissionClaim,
} from '../../lib/db/repositories/essays';
import { EssayServiceError } from '../../lib/server/essay/errors';
import { correctEssay } from '../../lib/server/essay/service';
import { createEssayInputFingerprint } from '../../lib/server/essay/fingerprint';
import { createGeneratedTheme } from '../../lib/server/essay/themes';
import { StudyAccessError } from '../../lib/server/study-access';
import { calculateOperatingHours } from '../../lib/contracts/operating-hours';

vi.mock('server-only', () => ({}));
vi.mock('../../lib/db/repositories/essays', () => ({
  claimEssaySubmission: vi.fn(),
  claimSharedTheme: vi.fn(),
  completeEssaySubmission: vi.fn(),
  failEssaySubmission: vi.fn(),
  getGeneratedTheme: vi.fn(),
  getRecentEssayThemeTitles: vi.fn(),
  upsertGeneratedThemes: vi.fn(),
}));

const client = {} as SupabaseClient<Database>;
const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const resultId = '6c07e303-9abc-43cb-a0c5-07d9f89bb239';
const theme = {
  id: '761442a5-05d3-44cb-bf3a-50cc7daf32cf',
  tema: 'Desafios para a democratização do acesso à cultura no Brasil',
  textoApoio1: 'Texto canônico com contexto social sobre o acesso à cultura no Brasil.',
  textoApoio2: 'Texto canônico com os impactos sociais e os desafios do acesso à cultura.',
};
const input = {
  submissionId: '161cfc57-9270-45cc-b527-b15706f890d2',
  userId,
  essay: 'Uma redação que aborda as barreiras sociais para o acesso à cultura no Brasil.',
  theme: { mode: 'generated' as const, id: theme.id },
};
const competence = (nota: number) => ({
  nota,
  comentario: 'Comentário específico que considera os argumentos apresentados na redação.',
});
const analysis = {
  status: 'aligned',
  justification: 'O texto aborda diretamente as dificuldades do acesso à cultura.',
  competencia1: competence(200),
  competencia2: competence(160),
  competencia3: competence(120),
  competencia4: competence(80),
  competencia5: competence(40),
  feedbackGeral: 'Feedback detalhado sobre a argumentação e a proposta de intervenção apresentadas.',
  pontoFortes: ['Argumentação consistente'],
  pontosAMelhorar: ['Aprofundar o repertório'],
};

function createRuntime(hasMaxAccess = false) {
  const complete = vi.fn<UserAiRuntime['complete']>().mockResolvedValue({
    content: JSON.stringify(analysis),
    provider: 'mock-provider',
    model: 'mock-model',
    tier: hasMaxAccess ? 'max' : 'standard',
  });
  const runtime: UserAiRuntime = {
    subscription: {
      planCode: hasMaxAccess ? 'max' : 'free', planName: hasMaxAccess ? 'Max' : 'Free',
      provider: null, status: 'free', hasMaxAccess, trialEligible: false,
      trialDays: null, cancelAtPeriodEnd: false, currentPeriodEnd: null,
      renewsAt: null, canceledAt: null, latestCheckoutSessionId: null,
      stripeCustomerId: null, stripeSubscriptionId: null, stripePriceId: null,
    },
    complete,
  };
  return { runtime, complete, loadRuntime: vi.fn(async () => runtime) };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(claimEssaySubmission).mockResolvedValue({ state: 'claimed' });
  vi.mocked(getGeneratedTheme).mockResolvedValue(theme);
  vi.mocked(failEssaySubmission).mockResolvedValue(undefined);
  vi.mocked(completeEssaySubmission).mockImplementation(async (_client, submission) => ({
    ...submission.result, id: resultId, nota: 600, createdAt: '2026-10-08T12:00:00Z', origem: 'IA',
  }));
});

describe('orquestração canônica de correções', () => {
  const repeatedOutcomes: EssaySubmissionClaim[] = [
    { state: 'completed', resultId },
    { state: 'in_progress' },
    { state: 'conflict' },
    { state: 'off_topic', justification: 'A redação aborda outro problema social.' },
  ];

  it.each(repeatedOutcomes)('encerra claim $state sem consultar plano, tema ou IA', async (outcome) => {
    const { loadRuntime, complete } = createRuntime();
    vi.mocked(claimEssaySubmission).mockResolvedValue(outcome);

    expect(await correctEssay(client, loadRuntime, input)).toEqual(outcome);
    expect(loadRuntime).not.toHaveBeenCalled();
    expect(getGeneratedTheme).not.toHaveBeenCalled();
    expect(complete).not.toHaveBeenCalled();
    expect(completeEssaySubmission).not.toHaveBeenCalled();
    expect(failEssaySubmission).not.toHaveBeenCalled();
  });

  it('resolve textos no banco por usuário e persiste score e snapshot antes de responder', async () => {
    const { loadRuntime, complete } = createRuntime();
    const outcome = await correctEssay(client, loadRuntime, input);

    expect(getGeneratedTheme).toHaveBeenCalledWith(client, theme.id, userId);
    const prompt = complete.mock.calls[0][0].messages[1].content;
    expect(prompt).toContain(theme.textoApoio1);
    expect(prompt).toContain(theme.textoApoio2);
    expect(completeEssaySubmission).toHaveBeenCalledWith(client, {
      submissionId: input.submissionId, userId, inputFingerprint: createEssayInputFingerprint(input),
      result: expect.objectContaining({
        id: expect.any(String), nota: 600, redacaoOriginal: input.essay,
        tema: theme.tema, textoApoio1: theme.textoApoio1, textoApoio2: theme.textoApoio2,
        competencia1: analysis.competencia1, competencia5: analysis.competencia5,
      }),
    });
    expect(outcome).toEqual({ state: 'completed', resultId, score: 600, provider: 'mock-provider' });
    expect(failEssaySubmission).not.toHaveBeenCalled();
  });

  it('recusa tema indisponível ou pertencente a outro usuário antes de consumir IA', async () => {
    const { loadRuntime, complete } = createRuntime();
    vi.mocked(getGeneratedTheme).mockResolvedValue(null);

    await expect(correctEssay(client, loadRuntime, input)).rejects.toMatchObject({ kind: 'theme_not_found' });
    expect(complete).not.toHaveBeenCalled();
    expect(completeEssaySubmission).not.toHaveBeenCalled();
    expect(failEssaySubmission).toHaveBeenCalledWith(client, expect.objectContaining({
      submissionId: input.submissionId, userId, inputFingerprint: createEssayInputFingerprint(input),
    }));
  });

  it('persiste fuga ao tema com identidade estável e justificativa reutilizável', async () => {
    const { loadRuntime, complete } = createRuntime();
    const justification = 'O texto trata de mobilidade urbana sem abordar o acesso à cultura.';
    complete.mockResolvedValue({ content: JSON.stringify({ status: 'off_topic', justification }), provider: 'mock-provider', model: 'mock-model', tier: 'standard' });

    expect(await correctEssay(client, loadRuntime, input)).toEqual({ state: 'off_topic', justification });
    expect(failEssaySubmission).toHaveBeenCalledWith(client, {
      submissionId: input.submissionId, userId,
      inputFingerprint: createEssayInputFingerprint(input), errorMessage: `off_topic:${justification}`,
    });
    expect(completeEssaySubmission).not.toHaveBeenCalled();
  });

  it('libera claim também quando carregar a assinatura falha', async () => {
    const loadRuntime = vi.fn(async (): Promise<UserAiRuntime> => { throw new Error('Plano indisponível'); });
    await expect(correctEssay(client, loadRuntime, input)).rejects.toMatchObject({ kind: 'unavailable' });
    expect(failEssaySubmission).toHaveBeenCalledWith(client, expect.objectContaining({
      submissionId: input.submissionId, errorMessage: 'Plano indisponível',
    }));
  });

  it('preserva recusa de horário e libera claim sem consumir IA', async () => {
    const accessError = new StudyAccessError(calculateOperatingHours(new Date('2026-10-09T03:00:00Z')));
    const loadRuntime = vi.fn(async (): Promise<UserAiRuntime> => { throw accessError; });

    await expect(correctEssay(client, loadRuntime, input)).rejects.toBe(accessError);
    expect(failEssaySubmission).toHaveBeenCalledWith(client, expect.objectContaining({
      submissionId: input.submissionId, errorMessage: accessError.message,
    }));
    expect(getGeneratedTheme).not.toHaveBeenCalled();
    expect(completeEssaySubmission).not.toHaveBeenCalled();
  });

  it('limita análise inválida a duas tentativas e não grava uma correção parcial', async () => {
    const { loadRuntime, complete } = createRuntime();
    complete.mockResolvedValue({ content: JSON.stringify({ ...analysis, competencia5: competence(100) }), provider: 'mock-provider', model: 'mock-model', tier: 'standard' });

    await expect(correctEssay(client, loadRuntime, input)).rejects.toBeInstanceOf(EssayServiceError);
    expect(complete).toHaveBeenCalledTimes(2);
    expect(complete.mock.calls.map(([request]) => request.maxAttempts)).toEqual([1, 1]);
    expect(completeEssaySubmission).not.toHaveBeenCalled();
    expect(failEssaySubmission).toHaveBeenCalledTimes(1);
  });

  it('preserva textos de apoio gerados no snapshot do tema manual', async () => {
    const { loadRuntime, complete } = createRuntime();
    complete.mockResolvedValueOnce({ content: JSON.stringify({ textoApoio1: theme.textoApoio1, textoApoio2: theme.textoApoio2 }), provider: 'mock-provider', model: 'mock-model', tier: 'standard' });
    const manualInput = { ...input, theme: { mode: 'manual' as const, tema: theme.tema } };

    await correctEssay(client, loadRuntime, manualInput);
    expect(getGeneratedTheme).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(2);
    expect(completeEssaySubmission).toHaveBeenCalledWith(client, expect.objectContaining({
      inputFingerprint: createEssayInputFingerprint(manualInput),
      result: expect.objectContaining({ tema: theme.tema, textoApoio1: theme.textoApoio1, textoApoio2: theme.textoApoio2 }),
    }));
  });
});

describe('catálogo de temas Free e Max', () => {
  it('reutiliza tema compartilhado sem consultas extras nem geração', async () => {
    const { runtime, complete } = createRuntime();
    vi.mocked(claimSharedTheme).mockResolvedValue(theme);

    expect(await createGeneratedTheme(client, runtime, userId)).toEqual({ theme });
    expect(complete).not.toHaveBeenCalled();
    expect(getRecentEssayThemeTitles).not.toHaveBeenCalled();
    expect(upsertGeneratedThemes).not.toHaveBeenCalled();
  });

  it.each([false, true])('persiste temas com privacidade hasMaxAccess=%s e retorna dados canônicos', async (hasMaxAccess) => {
    const { runtime, complete } = createRuntime(hasMaxAccess);
    const { id: _id, ...generatedTheme } = theme;
    complete.mockResolvedValue({ content: JSON.stringify({ themes: [generatedTheme] }), provider: 'mock-provider', model: 'mock-model', tier: hasMaxAccess ? 'max' : 'standard' });
    vi.mocked(getRecentEssayThemeTitles).mockResolvedValue(['Tema anterior a evitar']);
    vi.mocked(upsertGeneratedThemes).mockResolvedValue([theme]);
    vi.mocked(claimSharedTheme).mockResolvedValueOnce(null).mockResolvedValue(theme);

    expect(await createGeneratedTheme(client, runtime, userId)).toEqual({ theme, provider: 'mock-provider' });
    expect(upsertGeneratedThemes).toHaveBeenCalledWith(client, { userId, privateThemes: hasMaxAccess, themes: [generatedTheme] });
    expect(complete.mock.calls[0][0].messages[1].content).toContain('Tema anterior a evitar');
    expect(claimSharedTheme).toHaveBeenCalledTimes(hasMaxAccess ? 0 : 2);
  });
});
