import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Question } from '@/types';
import { extractJson } from '@/lib/ai/parse-json';
import { getUserAiRuntime, type UserAiRuntime } from '@/lib/server/ai/provider';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import { cleanupQuizAttemptsIfDue } from '@/lib/server/local-maintenance';
import {
  createQuizAttempt,
  getQuestionSignature,
  getRecentUserQuestionExposure,
  getStoredQuestionsForDisciplines,
  saveGeneratedQuestions,
  submitQuizAttempt,
} from '@/lib/db/repositories/quizzes';

const DISCIPLINES: Question['discipline'][] = ['Matemática', 'Português', 'Química', 'Física', 'Geografia'];
const QUESTIONS_PER_DISCIPLINE = 3;
const REUSED_QUESTIONS_PER_DISCIPLINE = 2;
const MAX_ATTEMPTS_PER_DISCIPLINE = 2;

type QuizSubmissionPayload = {
  attemptId: string;
  selectedAnswers: Record<string, string>;
};

type RawAlternative = {
  id?: string;
  text?: string;
  isCorrect?: boolean;
};

type RawQuestion = {
  discipline?: string;
  text?: string;
  explanation?: string;
  alternatives?: RawAlternative[];
  topic?: string;
  difficulty?: string;
};

type GeneratedQuestionCandidate = Question & {
  topic?: string | null;
  difficulty?: string | null;
};

type GenerationDiagnostics = Partial<Record<Question['discipline'], string>>;
type ReuseSummary = Record<string, {
  reused: number;
  generated: number;
  relaxedReuse?: number;
}>;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function tryAddQuestion(
  question: Question,
  target: Question[],
  selectedIds: Set<string>,
  selectedSignatures: Set<string>,
  options: {
    excludedIds?: Set<string>;
    excludedSignatures?: Set<string>;
    maxQuestions?: number;
  } = {}
) {
  if (options.maxQuestions && target.length >= options.maxQuestions) {
    return false;
  }

  const signature = getQuestionSignature(question);
  if (
    selectedIds.has(question.id) ||
    selectedSignatures.has(signature) ||
    options.excludedIds?.has(question.id) ||
    options.excludedSignatures?.has(signature)
  ) {
    return false;
  }

  target.push(question);
  selectedIds.add(question.id);
  selectedSignatures.add(signature);
  return true;
}

function fillQuestionsFromPool(
  pool: Question[],
  target: Question[],
  targetCount: number,
  selectedIds: Set<string>,
  selectedSignatures: Set<string>,
  options: {
    excludedIds?: Set<string>;
    excludedSignatures?: Set<string>;
  } = {}
) {
  let added = 0;

  for (const question of pool) {
    if (target.length >= targetCount) break;

    if (
      tryAddQuestion(question, target, selectedIds, selectedSignatures, {
        ...options,
        maxQuestions: targetCount,
      })
    ) {
      added += 1;
    }
  }

  return added;
}

function assertQuizSubmission(payload: unknown): QuizSubmissionPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload ausente ou inválido');
  }

  const { attemptId, selectedAnswers } = payload as Record<string, unknown>;
  if (
    typeof attemptId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId)
  ) {
    throw new Error('Tentativa de quiz inválida');
  }

  if (
    !selectedAnswers ||
    typeof selectedAnswers !== 'object' ||
    Array.isArray(selectedAnswers)
  ) {
    throw new Error('Mapa de respostas inválido');
  }

  const entries = Object.entries(selectedAnswers);
  if (
    entries.length > DISCIPLINES.length * QUESTIONS_PER_DISCIPLINE ||
    entries.some(([questionId, alternativeId]) =>
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(questionId) ||
      typeof alternativeId !== 'string' ||
      !alternativeId.trim() ||
      alternativeId.length > 64
    )
  ) {
    throw new Error('Mapa de respostas inválido');
  }

  return {
    attemptId,
    selectedAnswers: selectedAnswers as Record<string, string>,
  };
}

function normalizeGeneratedQuestion(
  discipline: Question['discipline'],
  rawQuestion: RawQuestion
): GeneratedQuestionCandidate | null {
  const text = rawQuestion.text?.trim();
  if (!text || !Array.isArray(rawQuestion.alternatives) || rawQuestion.alternatives.length < 4) {
    return null;
  }

  const alternatives = rawQuestion.alternatives
    .map((alternative, index) => {
      const letter = String.fromCharCode(65 + index);
      const alternativeText = alternative?.text?.trim();
      if (!alternativeText) return null;

      return {
        id: alternative?.id?.trim() || letter,
        text: alternativeText,
        isCorrect: Boolean(alternative?.isCorrect),
      };
    })
    .filter((alternative): alternative is Question['alternatives'][number] => Boolean(alternative));

  if (alternatives.length !== 4) return null;

  const uniqueAlternatives = new Set(alternatives.map((alternative) => normalizeText(alternative.text)));
  const correctCount = alternatives.filter((alternative) => alternative.isCorrect).length;
  if (uniqueAlternatives.size !== 4 || correctCount !== 1) return null;

  return {
    id: randomUUID(),
    discipline,
    text,
    explanation: rawQuestion.explanation?.trim() || 'Sem explicação disponível.',
    alternatives,
    topic: rawQuestion.topic?.trim() || null,
    difficulty: rawQuestion.difficulty?.trim() || 'desafiador',
  };
}

async function requestQuestionsForDiscipline(
  runtime: UserAiRuntime,
  input: {
    discipline: Question['discipline'];
    count: number;
    excludedTexts: string[];
  }
): Promise<{ questions: GeneratedQuestionCandidate[]; provider: string }> {
  const excludedBlock = input.excludedTexts.length > 0
    ? `Evite perguntas iguais ou muito parecidas com estes enunciados já usados:\n${input.excludedTexts
        .slice(0, 12)
        .map((text, index) => `${index + 1}. ${text}`)
        .join('\n')}`
    : 'Todas as questões precisam ser inéditas entre si.';

  const prompt = `
    Atue como um professor especialista no ENEM.
    Crie exatamente ${input.count} questões inéditas e de alta qualidade sobre ${input.discipline}.

    Requisitos obrigatórios:
    1. Nível de dificuldade: desafiador, estilo ENEM.
    2. Contextualização: cada questão deve trazer texto-base ou situação-problema.
    3. Estrutura: 4 alternativas (A, B, C, D) e APENAS UMA correta.
    4. Qualidade: não repita alternativas, não crie pegadinhas vagas e não use explicações superficiais.
    5. Explicação: explique por que a correta está certa e por que as outras não resolvem o problema.

    ${excludedBlock}

    Responda no formato JSON:
    {
      "questions": [
        {
          "discipline": "${input.discipline}",
          "topic": "assunto central",
          "difficulty": "desafiador",
          "text": "Texto base + enunciado da questão",
          "alternatives": [
            {"id": "A", "text": "Alternativa A", "isCorrect": false},
            {"id": "B", "text": "Alternativa B", "isCorrect": false},
            {"id": "C", "text": "Alternativa C", "isCorrect": true},
            {"id": "D", "text": "Alternativa D", "isCorrect": false}
          ],
          "explanation": "Explicação detalhada."
        }
      ]
    }
  `;

  const response = await runtime.complete({
    label: `generateQuestions:${input.discipline}`,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.75,
    maxTokens: 4096,
    topP: 1,
    expectJson: true,
  });

  const parsed = extractJson<Record<string, unknown>>(response.content);
  const rawQuestions = Array.isArray(parsed.questions)
    ? parsed.questions
    : Array.isArray(parsed.data)
      ? parsed.data
      : Array.isArray(parsed)
        ? parsed
        : [];

  const normalized = rawQuestions
    .map((question) => normalizeGeneratedQuestion(input.discipline, question as RawQuestion))
    .filter((question): question is GeneratedQuestionCandidate => Boolean(question));

  if (normalized.length === 0) {
    throw new Error('A IA não retornou questões válidas.');
  }

  return {
    questions: normalized,
    provider: response.provider,
  };
}

async function generateFreshQuestionsForDiscipline(
  runtime: UserAiRuntime,
  discipline: Question['discipline'],
  count: number,
  excludedSignatures: Set<string>,
  excludedTexts: string[]
): Promise<{
  questions: GeneratedQuestionCandidate[];
  provider?: string;
  error?: string;
}> {
  if (count <= 0) {
    return { questions: [] };
  }

  let lastError = 'Falha ao gerar questões';

  for (let attempts = 1; attempts <= MAX_ATTEMPTS_PER_DISCIPLINE; attempts += 1) {
    try {
      const generated = await requestQuestionsForDiscipline(runtime, {
        discipline,
        count,
        excludedTexts,
      });

      const uniqueQuestions: GeneratedQuestionCandidate[] = [];
      const seenSignatures = new Set(excludedSignatures);

      for (const question of generated.questions) {
        const signature = getQuestionSignature(question);
        if (seenSignatures.has(signature)) continue;
        seenSignatures.add(signature);
        uniqueQuestions.push(question);
      }

      if (uniqueQuestions.length >= count) {
        return {
          questions: uniqueQuestions.slice(0, count),
          provider: generated.provider,
        };
      }

      lastError = `(${generated.provider}) Recebemos ${uniqueQuestions.length} questão(ões) válidas`;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : 'Falha desconhecida ao consultar o modelo';
      lastError = message;
      console.error(`Erro ao gerar questões de ${discipline} (tentativa ${attempts}):`, error);
    }
  }

  return { questions: [], error: lastError };
}

export async function GET(request: NextRequest) {
  try {
    const originError = ensureTrustedOrigin(request);
    if (originError) {
      return originError;
    }

    const auth = await resolveRequestUserFromCookies();
    if ('error' in auth) {
      return auth.error;
    }

    const adminClient = createAdminClient();
    if (!adminClient) {
      return NextResponse.json(
        { error: 'Supabase service role não configurado.' },
        { status: 500 }
      );
    }

    const operatingInfo = await getOperatingHoursInfo();
    if (!operatingInfo.isOpen) {
      return NextResponse.json(
        {
          error: 'Sistema fora do horário de funcionamento',
          message: operatingInfo.message,
          horarioFuncionamento: `${operatingInfo.opensAt} - ${operatingInfo.closesAt}`,
        },
        { status: 403 }
      );
    }

    const forwardedFor = request.headers.get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const rateIdentifier = auth.userId || ip;
    const rateResult = await checkRateLimit(rateIdentifier, '/api/questoes', 5, 1);
    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          error: 'Muitas requisições',
          message: `Você atingiu o limite de requisições. Tente novamente após ${rateResult.resetAt.toISOString()}.`,
          resetAt: rateResult.resetAt.toISOString(),
        },
        { status: 429 }
      );
    }

    const disciplinesParam = request.nextUrl.searchParams.get('disciplines');
    const disciplines = disciplinesParam
      ? disciplinesParam
          .split(',')
          .map((item) => item.trim())
          .filter((item): item is Question['discipline'] => DISCIPLINES.includes(item as Question['discipline']))
      : DISCIPLINES;

    if (disciplines.length === 0) {
      return NextResponse.json({ error: 'Pelo menos uma disciplina deve ser selecionada' }, { status: 400 });
    }

    const aiRuntime = await getUserAiRuntime(auth.userId);
    await cleanupQuizAttemptsIfDue();
    const [storedByDiscipline, recentExposure] = await Promise.all([
      getStoredQuestionsForDisciplines(adminClient, disciplines, { limit: 400 }),
      getRecentUserQuestionExposure(adminClient, auth.userId, 10),
    ]);

    const selectedQuestions: Question[] = [];
    const diagnostics: GenerationDiagnostics = {};
    const missing: Question['discipline'][] = [];
    const providersUsed: Record<string, string> = {};
    const reuseSummary: ReuseSummary = {};

    const recentIds = recentExposure.questionIds;
    const recentSignatures = recentExposure.questionSignatures;
    const selectedIds = new Set<string>();
    const selectedSignatures = new Set<string>();

    for (const discipline of disciplines) {
      const disciplinePool = shuffleArray(storedByDiscipline[discipline] ?? []);
      const disciplineQuestions: Question[] = [];
      let reusedCount = 0;

      if (!aiRuntime.subscription.hasMaxAccess) {
        reusedCount += fillQuestionsFromPool(
          disciplinePool,
          disciplineQuestions,
          REUSED_QUESTIONS_PER_DISCIPLINE,
          selectedIds,
          selectedSignatures,
          {
            excludedIds: recentIds,
            excludedSignatures: recentSignatures,
          }
        );
      }

      const requiredFreshQuestions = QUESTIONS_PER_DISCIPLINE - disciplineQuestions.length;
      let generatedCount = 0;
      let relaxedReuseCount = 0;

      if (requiredFreshQuestions > 0) {
        const excludedTexts = Array.from(
          new Set([
            ...disciplinePool.map((question) => question.text),
            ...(recentExposure.recentQuestionsByDiscipline[discipline] ?? []),
          ])
        ).slice(0, 16);

        const generated = await generateFreshQuestionsForDiscipline(
          aiRuntime,
          discipline,
          requiredFreshQuestions,
          new Set([...selectedSignatures, ...recentSignatures]),
          excludedTexts
        );

        if (generated.provider) {
          providersUsed[discipline] = generated.provider;
        }

        if (generated.questions.length > 0) {
          const canonicalGenerated = await saveGeneratedQuestions(
            adminClient,
            generated.questions
          );

          for (const question of canonicalGenerated) {
            if (disciplineQuestions.length >= QUESTIONS_PER_DISCIPLINE) break;

            if (
              tryAddQuestion(question, disciplineQuestions, selectedIds, selectedSignatures, {
                excludedIds: recentIds,
                excludedSignatures: recentSignatures,
                maxQuestions: QUESTIONS_PER_DISCIPLINE,
              })
            ) {
              generatedCount += 1;
            }
          }
        }

        if (generated.questions.length === 0 && generated.error) {
          diagnostics[discipline] = generated.error;
        }
      }

      if (disciplineQuestions.length < QUESTIONS_PER_DISCIPLINE) {
        reusedCount += fillQuestionsFromPool(
          disciplinePool,
          disciplineQuestions,
          QUESTIONS_PER_DISCIPLINE,
          selectedIds,
          selectedSignatures,
          {
            excludedIds: recentIds,
            excludedSignatures: recentSignatures,
          }
        );
      }

      if (disciplineQuestions.length < QUESTIONS_PER_DISCIPLINE) {
        relaxedReuseCount += fillQuestionsFromPool(
          disciplinePool,
          disciplineQuestions,
          QUESTIONS_PER_DISCIPLINE,
          selectedIds,
          selectedSignatures
        );
      }

      reuseSummary[discipline] = {
        reused: reusedCount + relaxedReuseCount,
        generated: generatedCount,
        ...(relaxedReuseCount > 0 ? { relaxedReuse: relaxedReuseCount } : {}),
      };

      if (disciplineQuestions.length < QUESTIONS_PER_DISCIPLINE) {
        diagnostics[discipline] =
          diagnostics[discipline] ??
          'Não foi possível completar a disciplina sem repetir questões recentes.';
        missing.push(discipline);
        continue;
      }

      selectedQuestions.push(...disciplineQuestions.slice(0, QUESTIONS_PER_DISCIPLINE));
    }

    if (missing.length > 0 || selectedQuestions.length === 0) {
      return NextResponse.json(
        {
          error: 'Não foi possível montar o simulado completo',
          message: 'Não foi possível preparar questões suficientes sem repetir seu histórico recente. Tente novamente em instantes.',
          diagnostics,
          missing_disciplines: missing,
          providers_used: providersUsed,
        },
        { status: 503 }
      );
    }

    const shuffled = shuffleArray(selectedQuestions);
    const attempt = await createQuizAttempt(adminClient, auth.userId, shuffled);

    return NextResponse.json({
      questions: shuffled,
      attemptId: attempt.id,
      expiresAt: attempt.expires_at,
      totalQuestions: shuffled.length,
      disciplineCounts: disciplines.map((discipline) => ({
        discipline,
        count: shuffled.filter((question) => question.discipline === discipline).length,
      })),
      providersUsed,
      reuseSummary,
      plan: aiRuntime.subscription.planCode,
    });
  } catch (error) {
    console.error('Erro ao gerar questões:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar questões',
        message: 'Ocorreu um erro interno. Tente novamente em instantes.',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const originError = ensureTrustedOrigin(request);
  if (originError) {
    return originError;
  }

  let parsedPayload: QuizSubmissionPayload;
  try {
    const raw = await request.json();
    parsedPayload = assertQuizSubmission(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON inválido';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    return auth.error;
  }

  const { userId } = auth;
  const adminClient = createAdminClient();
  if (!adminClient) {
    return NextResponse.json(
      { error: 'Supabase service role não configurado.' },
      { status: 500 }
    );
  }

  try {
    const result = await submitQuizAttempt(adminClient, {
      attemptId: parsedPayload.attemptId,
      userId,
      selectedAnswers: parsedPayload.selectedAnswers,
    });

    return NextResponse.json({
      success: true,
      saved: true,
      result: {
        id: result.id,
        totalQuestions: result.total_questions,
        correctAnswers: result.correct_answers,
        wrongAnswers: result.wrong_answers,
        unansweredQuestions: result.unanswered_questions,
        score: result.score,
      },
    });
  } catch (error) {
    console.error('Erro ao salvar resultado do simulado:', error);
    const message = error instanceof Error ? error.message : '';
    if (message.includes('quiz_attempt_expired')) {
      return NextResponse.json({ error: 'Tentativa expirada' }, { status: 410 });
    }
    if (message.includes('quiz_attempt_not_found')) {
      return NextResponse.json({ error: 'Tentativa não encontrada' }, { status: 404 });
    }
    if (
      message.includes('invalid_') ||
      message.includes('unknown_question') ||
      message.includes('answer_for_unknown_question')
    ) {
      return NextResponse.json({ error: 'Respostas inválidas' }, { status: 400 });
    }
    return NextResponse.json(
      { error: 'Erro ao salvar resultado do simulado' },
      { status: 500 }
    );
  }
}
