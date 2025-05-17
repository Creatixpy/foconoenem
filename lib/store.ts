import { EssayResult } from "@/types";

// Simulação de banco de dados em memória para armazenar resultados
const results: Record<string, EssayResult> = {};

export function getResult(id: string): EssayResult | undefined {
  return results[id];
}

export function storeResult(id: string, result: EssayResult): void {
  results[id] = result;
}
