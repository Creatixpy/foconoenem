import { QuizResult } from "@/types";

// Armazenamento em memória para os resultados dos quizzes
// Em um ambiente de produção, isso deveria usar um banco de dados
const quizResults: Record<string, QuizResult> = {};

/**
 * Armazena um resultado de quiz
 * @param id ID único do resultado
 * @param result Objeto com o resultado do quiz
 */
export function storeQuizResult(id: string, result: QuizResult): void {
  quizResults[id] = result;
}

/**
 * Recupera um resultado de quiz pelo ID
 * @param id ID do resultado a ser recuperado
 * @returns O resultado do quiz ou undefined se não encontrado
 */
export function getQuizResult(id: string): QuizResult | undefined {
  return quizResults[id];
}

/**
 * Lista todos os IDs de resultados armazenados
 * @returns Array com os IDs dos resultados
 */
export function listQuizResultIds(): string[] {
  return Object.keys(quizResults);
}
