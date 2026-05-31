import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import type { Question, QuizResult } from '@/types';
import { extractJson } from '@/lib/ai/parse-json';
import { getUserAiRuntime, type UserAiRuntime } from '@/lib/server/ai/provider';
import { getOperatingHoursInfo } from '@/lib/server/operating-hours';
import { checkRateLimit } from '@/lib/server/rate-limit';
import { resolveRequestUserFromCookies } from '@/lib/server/auth-request';
import { createAdminClient } from '@/lib/db/server';
import { ensureTrustedOrigin } from '@/lib/server/request-origin';
import {
  createQuizResult,
  getQuestionSignature,
  getRecentUserQuestionExposure,
  getStoredQuestionsForDisciplines,
  saveGeneratedQuestions,
} from '@/lib/db/repositories/quizzes';

const DISCIPLINES: Question['discipline'][] = ['Matemática', 'Português', 'Química', 'Física', 'Geografia'];
const QUESTIONS_PER_DISCIPLINE = 3;
const REUSED_QUESTIONS_PER_DISCIPLINE = 2;
const MAX_ATTEMPTS_PER_DISCIPLINE = 2;

type QuizRequestPayload = {
  result: QuizResult;
  selectedAnswers: Record<string, string>;
  questions: Question[];
  disciplines: Question['discipline'][];
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

function assertQuizPayload(payload: unknown): QuizRequestPayload {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload ausente ou inválido');
  }

  const { result, selectedAnswers, questions, disciplines } = payload as Record<string, unknown>;

  if (!result || typeof result !== 'object') {
    throw new Error('Dados do resultado inválidos');
  }

  const castResult = result as QuizResult;
  const requiredNumbers: Array<keyof QuizResult> = [
    'totalQuestions',
    'correctAnswers',
    'wrongAnswers',
    'unansweredQuestions',
    'score',
  ];
  for (const key of requiredNumbers) {
    if (typeof castResult[key] !== 'number') {
      throw new Error('Dados do resultado inválidos');
    }
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error('Lista de questões inválida');
  }

  if (!selectedAnswers || typeof selectedAnswers !== 'object') {
    throw new Error('Mapa de respostas inválido');
  }

  const normalizedDisciplines = Array.isArray(disciplines)
    ? disciplines.filter((item): item is Question['discipline'] =>
        typeof item === 'string' ? DISCIPLINES.includes(item as Question['discipline']) : false)
    : [];

  return {
    result: castResult,
    selectedAnswers: selectedAnswers as Record<string, string>,
    questions: questions as Question[],
    disciplines: normalizedDisciplines,
  };
}

function isValidSubmittedQuestion(question: Question) {
  if (
    !question ||
    typeof question.id !== 'string' ||
    !question.id ||
    typeof question.text !== 'string' ||
    !question.text.trim() ||
    !DISCIPLINES.includes(question.discipline)
  ) {
    return false;
  }

  if (!Array.isArray(question.alternatives) || question.alternatives.length < 2) {
    return false;
  }

  const correctCount = question.alternatives.filter((alternative) => alternative.isCorrect).length;
  return correctCount === 1 && question.alternatives.every((alternative) =>
    typeof alternative.id === 'string' &&
    Boolean(alternative.id) &&
    typeof alternative.text === 'string' &&
    Boolean(alternative.text.trim())
  );
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
          const canonicalGenerated = aiRuntime.subscription.hasMaxAccess
            ? generated.questions
            : await saveGeneratedQuestions(adminClient, generated.questions);

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

    return NextResponse.json({
      questions: shuffled,
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

  let parsedPayload: QuizRequestPayload;
  try {
    const raw = await request.json();
    parsedPayload = assertQuizPayload(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'JSON inválido';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const auth = await resolveRequestUserFromCookies();
  if ('error' in auth) {
    if (auth.error.status === 401) {
      return NextResponse.json({ success: true, saved: false, reason: 'not_authenticated' });
    }
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
    if (!parsedPayload.questions.every(isValidSubmittedQuestion)) {
      return NextResponse.json(
        { error: 'Lista de questões inválida' },
        { status: 400 }
      );
    }

    let correctAnswers = 0;
    let unansweredQuestions = 0;

    const answersData = parsedPayload.questions.map((question) => {
      const selectedId = parsedPayload.selectedAnswers[question.id];
      const isAnswered = typeof selectedId === 'string' && selectedId.length > 0;
      const selectedAlternative = isAnswered
        ? question.alternatives.find((alternative) => alternative.id === selectedId)
        : undefined;
      const isCorrect = Boolean(selectedAlternative?.isCorrect);

      if (!isAnswered) {
        unansweredQuestions += 1;
      } else if (isCorrect) {
        correctAnswers += 1;
      }

      return {
        question_id: question.id,
        selected_alternative_id: isAnswered ? selectedId : null,
        is_correct: isCorrect,
      };
    });
    const totalQuestions = parsedPayload.questions.length;
    const wrongAnswers = totalQuestions - correctAnswers - unansweredQuestions;
    const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
    const disciplines = Array.from(
      new Set(
        parsedPayload.questions
          .map((question) => question.discipline)
          .filter((discipline): discipline is Question['discipline'] => DISCIPLINES.includes(discipline))
      )
    );

    await createQuizResult(adminClient, userId, {
      totalQuestions,
      correctAnswers,
      wrongAnswers,
      unansweredQuestions,
      score,
      disciplines,
      questionsData: parsedPayload.questions,
      answersData,
    });

    const { error: statsError } = await adminClient.rpc('recalculate_user_statistics', {
      target_user_id: userId,
    });

    if (statsError) {
      console.error('Erro ao recalcular estatísticas:', statsError);
    }

    return NextResponse.json({ success: true, saved: true });
  } catch (error) {
    console.error('Erro ao salvar resultado do simulado:', error);
    return NextResponse.json(
      { error: 'Erro ao salvar resultado do simulado' },
      { status: 500 }
    );
  }
}
