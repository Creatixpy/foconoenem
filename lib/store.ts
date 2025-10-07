import { EssayResult, Question } from "@/types";
import { supabase } from "./supabase";

/**
 * Obtém um resultado de redação pelo ID do Supabase
 */
export async function getResult(id: string): Promise<EssayResult | null> {
  try {
    const { data, error } = await supabase
      .from('essay_results')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar resultado:", error);
      return null;
    }

    if (!data) return null;
    
    // Converter do formato do banco para o formato da aplicação
    return {
      id: data.id,
      nota: data.nota,
      competencia1: data.competencia1,
      competencia2: data.competencia2,
      competencia3: data.competencia3,
      competencia4: data.competencia4,
      competencia5: data.competencia5,
      feedbackGeral: data.feedback_geral,
      pontoFortes: data.ponto_fortes || [],
      pontosAMelhorar: data.pontos_a_melhorar || [],
      redacaoOriginal: data.redacao_original,
      createdAt: data.created_at,
      origem: data.origem as "IA" | "Simulação",
      tema: data.tema,
      textoApoio1: data.texto_apoio1,
      textoApoio2: data.texto_apoio2
    };
  } catch (error) {
    console.error("Erro ao obter resultado:", error);
    return null;
  }
}

/**
 * Armazena um resultado de redação no Supabase
 */
export async function storeResult(id: string, result: EssayResult & { user_id?: string }): Promise<void> {
  try {
    const { error } = await supabase
      .from('essay_results')
      .insert({
        id,
        nota: result.nota,
        competencia1: result.competencia1,
        competencia2: result.competencia2,
        competencia3: result.competencia3,
        competencia4: result.competencia4,
        competencia5: result.competencia5,
        feedback_geral: result.feedbackGeral,
        ponto_fortes: result.pontoFortes,
        pontos_a_melhorar: result.pontosAMelhorar,
        redacao_original: result.redacaoOriginal,
        origem: result.origem,
        tema: result.tema,
        texto_apoio1: result.textoApoio1,
        texto_apoio2: result.textoApoio2,
        user_id: result.user_id || null,
        created_at: result.createdAt
      });
    
    if (error) {
      console.error("Erro ao armazenar resultado:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao armazenar resultado:", error);
    throw error;
  }
}

/**
 * Limpa o armazenamento de resultados (útil para testes)
 */
export async function clearResults(): Promise<void> {
  try {
    const { error } = await supabase
      .from('essay_results')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Deleta todos
    
    if (error) {
      console.error("Erro ao limpar resultados:", error);
    }
  } catch (error) {
    console.error("Erro ao limpar resultados:", error);
  }
}

type QuizResultStoragePayload = {
  user_id?: string | null;
  total_questions: number;
  correct_answers: number;
  wrong_answers: number;
  unanswered_questions: number;
  score: number;
  questions: Question[];
  answers: Record<string, string>;
  disciplines: string[];
  created_at?: string;
};

export async function storeQuizResult(payload: QuizResultStoragePayload): Promise<void> {
  try {
    const { error } = await supabase
      .from('quiz_results')
      .insert({
        user_id: payload.user_id ?? null,
        total_questions: payload.total_questions,
        correct_answers: payload.correct_answers,
        wrong_answers: payload.wrong_answers,
        unanswered_questions: payload.unanswered_questions,
        score: payload.score,
        questions_data: payload.questions,
        answers_data: payload.answers,
        disciplines: payload.disciplines,
        created_at: payload.created_at ?? new Date().toISOString()
      });

    if (error) {
      console.error("Erro ao armazenar resultado de simulado:", error);
      throw error;
    }
  } catch (error) {
    console.error("Erro ao armazenar resultado de simulado:", error);
    throw error;
  }
}
