import { describe, expect, it } from 'vitest';
import {
  calculateEssayScore,
  essayAnalysisSchema,
} from '../../lib/contracts/essay';
import {
  generatedQuestionSchema,
  toPublicQuestion,
  type CanonicalQuestion,
} from '../../lib/contracts/quiz';
import { parseQuizResult } from '../../lib/contracts/quiz-result';
import { createEssayInputFingerprint } from '../../lib/server/essay/fingerprint';

const alternatives = [
  { id: 'A', text: 'Alternativa incorreta número um', isCorrect: false },
  { id: 'B', text: 'Alternativa correta número dois', isCorrect: true },
  { id: 'C', text: 'Alternativa incorreta número três', isCorrect: false },
  { id: 'D', text: 'Alternativa incorreta número quatro', isCorrect: false },
];

const question: CanonicalQuestion = {
  id: '761442a5-05d3-44cb-bf3a-50cc7daf32cf',
  discipline: 'Matemática',
  text: 'Qual alternativa apresenta corretamente o resultado solicitado pelo enunciado?',
  alternatives,
  explanation: 'A alternativa B é a única que satisfaz integralmente as condições do enunciado.',
};

const competence = (nota: 0 | 40 | 80 | 120 | 160 | 200) => ({
  nota,
  comentario: 'Comentário específico, fundamentado e suficientemente detalhado.',
});

describe('contratos canônicos de redação e quiz', () => {
  it('rejeita questões ambíguas e propriedades não previstas', () => {
    const { id: _id, ...generatedQuestion } = question;
    expect(generatedQuestionSchema.safeParse({
      ...generatedQuestion,
      alternatives: alternatives.map((alternative) => ({ ...alternative, isCorrect: true })),
    }).success).toBe(false);

    expect(generatedQuestionSchema.safeParse({ ...generatedQuestion, unexpected: true }).success).toBe(false);
  });

  it('serializa questões públicas sem gabarito nem explicação', () => {
    const serialized = toPublicQuestion(question);
    expect(serialized).not.toHaveProperty('explanation');
    expect(serialized.alternatives.every((alternative) => !('isCorrect' in alternative))).toBe(true);
  });

  it('aceita somente notas ENEM canônicas e calcula a soma exata', () => {
    const parsed = essayAnalysisSchema.parse({
      status: 'aligned',
      justification: 'A redação responde diretamente ao recorte temático proposto.',
      competencia1: competence(200),
      competencia2: competence(160),
      competencia3: competence(120),
      competencia4: competence(80),
      competencia5: competence(40),
      feedbackGeral: 'Feedback geral específico, coerente e baseado no texto apresentado.',
      pontoFortes: ['Argumentação consistente'],
      pontosAMelhorar: ['Aprofundar o repertório'],
    });
    if (parsed.status !== 'aligned') throw new Error('Resultado alinhado esperado.');
    expect(calculateEssayScore(parsed)).toBe(600);
    expect(essayAnalysisSchema.safeParse({
      ...parsed,
      competencia5: { ...competence(40), nota: 1 },
    }).success).toBe(false);
  });

  it('gera fingerprint idempotente e detecta mudança de conteúdo', () => {
    const first = createEssayInputFingerprint({
      essay: '  Uma redação de teste com conteúdo estável.  ',
      theme: { mode: 'manual', tema: 'Tema estável' },
    });
    const retry = createEssayInputFingerprint({
      essay: 'Uma redação de teste com conteúdo estável.',
      theme: { mode: 'manual', tema: 'Tema estável' },
    });
    const collision = createEssayInputFingerprint({
      essay: 'Uma redação de teste com conteúdo diferente.',
      theme: { mode: 'manual', tema: 'Tema estável' },
    });
    expect(retry).toBe(first);
    expect(collision).not.toBe(first);
  });

  it('mapeia a revisão persistida sem recalcular o resultado no cliente', () => {
    const result = parseQuizResult({
      id: '6c07e303-9abc-43cb-a0c5-07d9f89bb239',
      total_questions: 1,
      correct_answers: 1,
      wrong_answers: 0,
      unanswered_questions: 0,
      score: 100,
      questions_data: [{
        id: question.id,
        discipline: question.discipline,
        text: question.text,
        alternatives,
        explanation: question.explanation,
      }],
      answers_data: [{
        question_id: question.id,
        selected_alternative_id: 'B',
        is_correct: true,
      }],
    });

    expect(result.questions[0]).toMatchObject({
      selectedAlternativeId: 'B',
      correctAlternativeId: 'B',
      isCorrect: true,
    });
  });
});
