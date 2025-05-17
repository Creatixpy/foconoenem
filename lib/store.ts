import { EssayResult } from "@/types";

// Simulação de banco de dados em memória para armazenar resultados
let results: Record<string, EssayResult> = {};

/**
 * Obtém um resultado de redação pelo ID
 */
export function getResult(id: string): EssayResult | undefined {
  try {
    // Para testes, verifica se existe no localStorage
    if (typeof window !== 'undefined') {
      const storedResult = localStorage.getItem(`essay_result_${id}`);
      if (storedResult) {
        try {
          return JSON.parse(storedResult) as EssayResult;
        } catch (e) {
          console.error("Erro ao parsear resultado do localStorage:", e);
        }
      }
    }
    
    // Retorna do armazenamento em memória
    return results[id];
  } catch (error) {
    console.error("Erro ao obter resultado:", error);
    return undefined;
  }
}

/**
 * Armazena um resultado de redação
 */
export function storeResult(id: string, result: EssayResult): void {
  try {
    // Armazena em memória
    results[id] = result;
    
    // Para testes, armazena também no localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(`essay_result_${id}`, JSON.stringify(result));
      } catch (e) {
        console.error("Erro ao armazenar no localStorage:", e);
      }
    }
  } catch (error) {
    console.error("Erro ao armazenar resultado:", error);
  }
}

/**
 * Limpa o armazenamento de resultados (útil para testes)
 */
export function clearResults(): void {
  results = {};
}
