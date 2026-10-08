import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { UserAiRuntime } from '../../lib/server/ai/provider';

const dependencies = vi.hoisted(() => ({ runtime: vi.fn(), rateLimit: vi.fn(), correct: vi.fn(), prepare: vi.fn(), theme: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('next/server', async (importOriginal) => ({ ...await importOriginal<typeof import('next/server')>(), after: vi.fn() }));
vi.mock('@/lib/db/server', () => ({ createAdminClient: () => ({}) }));
vi.mock('@/lib/server/auth-request', () => ({ resolveRequestUserFromCookies: async () => ({ userId: '01928cf9-4aca-4037-8ba0-673edc94be5a' }) }));
vi.mock('@/lib/server/request-origin', () => ({ ensureTrustedOrigin: () => null }));
vi.mock('@/lib/server/rate-limit', () => ({ checkRateLimit: dependencies.rateLimit }));
vi.mock('@/lib/server/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/lib/server/local-maintenance', () => ({ cleanupEssaySubmissionsIfDue: vi.fn(), cleanupCachedThemesIfDue: vi.fn(), cleanupQuizAttemptsIfDue: vi.fn(), cleanupGeneratedQuestionsIfDue: vi.fn() }));
vi.mock('@/lib/server/essay/service', () => ({ correctEssay: dependencies.correct }));
vi.mock('@/lib/server/quiz/service', () => ({ prepareQuiz: dependencies.prepare }));
vi.mock('@/lib/server/essay/themes', () => ({ createGeneratedTheme: dependencies.theme }));
vi.mock('@/lib/server/study-access', async (importOriginal) => ({
  ...await importOriginal<typeof import('../../lib/server/study-access')>(),
  getStudyAiRuntime: dependencies.runtime,
}));

import { POST as correctEssay } from '../../app/api/corrigir/route';
import { POST as generateTheme } from '../../app/api/gerar-tema/route';
import { POST as prepareQuiz } from '../../app/api/questoes/route';
import { StudyAccessError } from '../../lib/server/study-access';
import { calculateOperatingHours } from '../../lib/contracts/operating-hours';

const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const operationId = '161cfc57-9270-45cc-b527-b15706f890d2';
const scenarios = [
  { name: 'correção', path: '/api/corrigir', handler: correctEssay, limit: 5, status: 200, payload: { submissionId: operationId, redacao: 'Redação suficientemente longa que apresenta uma discussão sobre desafios sociais.', theme: { mode: 'manual', tema: 'Os desafios da educação brasileira' } } },
  { name: 'tema', path: '/api/gerar-tema', handler: generateTheme, limit: 3, status: 200, payload: {} },
  { name: 'simulado', path: '/api/questoes', handler: prepareQuiz, limit: 5, status: 201, payload: { requestId: operationId, disciplines: ['Matemática'] } },
];

function request(path: string, payload: unknown) {
  return new NextRequest(`https://site.test${path}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
}

beforeEach(() => {
  dependencies.rateLimit.mockResolvedValue({ allowed: true, remaining: 1, resetAt: new Date('2026-10-09T03:01:00Z') });
  dependencies.runtime.mockResolvedValue({ subscription: { hasMaxAccess: true, planCode: 'max' }, complete: vi.fn() });
  dependencies.correct.mockImplementation(async (_client, loadRuntime: () => Promise<UserAiRuntime>) => {
    await loadRuntime();
    return { state: 'completed', resultId: operationId };
  });
  dependencies.prepare.mockImplementation(async (_client, loadRuntime: () => Promise<UserAiRuntime>) => {
    await loadRuntime();
    return { attemptId: operationId, expiresAt: '2026-10-10T03:00:00Z', questions: [] };
  });
  dependencies.theme.mockResolvedValue({ theme: { id: operationId, tema: 'Os desafios da educação brasileira', textoApoio1: 'Texto de apoio um.', textoApoio2: 'Texto de apoio dois.' } });
});
afterEach(() => vi.resetAllMocks());

describe.each(scenarios)('disponibilidade do endpoint de $name', ({ path, handler, payload, limit, status }) => {
  it('executa com runtime Max autorizado e conserva a quota original', async () => {
    const response = await handler(request(path, payload));
    expect(response.status).toBe(status);
    expect(dependencies.rateLimit).toHaveBeenCalledExactlyOnceWith(userId, path, limit, 1);
    expect(dependencies.runtime).toHaveBeenCalledExactlyOnceWith(userId);
  });

  it('traduz a recusa de horário Free em 403', async () => {
    const operatingInfo = calculateOperatingHours(new Date('2026-10-09T03:00:00Z'));
    dependencies.runtime.mockRejectedValue(new StudyAccessError(operatingInfo));
    const response = await handler(request(path, payload));
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: 'outside_operating_hours', message: operatingInfo.message });
  });

  it('mantém Max sujeito à quota e rejeita excesso antes de carregar plano ou IA', async () => {
    dependencies.rateLimit.mockResolvedValue({ allowed: false, remaining: 0, resetAt: new Date('2026-10-09T03:01:00Z') });
    const response = await handler(request(path, payload));
    expect(response.status).toBe(429);
    expect(await response.json()).toMatchObject({ error: 'rate_limit_exceeded' });
    expect(dependencies.runtime).not.toHaveBeenCalled();
    expect(dependencies.correct).not.toHaveBeenCalled();
    expect(dependencies.prepare).not.toHaveBeenCalled();
    expect(dependencies.theme).not.toHaveBeenCalled();
  });
});

it('replays canônicos continuam disponíveis sem depender da consulta de plano/horário', async () => {
  dependencies.runtime.mockRejectedValue(new Error('Subscription unavailable'));
  dependencies.correct.mockResolvedValue({ state: 'completed', resultId: operationId });
  dependencies.prepare.mockResolvedValue({ attemptId: operationId, expiresAt: '2026-10-10T03:00:00Z', questions: [] });

  expect((await correctEssay(request(scenarios[0].path, scenarios[0].payload))).status).toBe(200);
  expect((await prepareQuiz(request(scenarios[2].path, scenarios[2].payload))).status).toBe(201);
  expect(dependencies.runtime).not.toHaveBeenCalled();
});
