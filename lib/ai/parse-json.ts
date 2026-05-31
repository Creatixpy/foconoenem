/**
 * Safe JSON extraction from AI responses.
 * Handles direct JSON, markdown-fenced JSON, and raw regex extraction.
 */
export function extractJson<T>(raw: string): T {
  // 1. Try direct parse
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continue to fallback
  }

  // 2. Try markdown fenced block (object or array)
  const fencedMatch =
    raw.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/) ||
    raw.match(/```(?:json)?\s*(\[[\s\S]*?\])\s*```/);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1].trim()) as T;
  }

  // 3. Try raw object/array extraction
  const rawMatch =
    raw.match(/(\{[\s\S]*\})/) ||
    raw.match(/(\[[\s\S]*\])/);
  if (rawMatch?.[1]) {
    return JSON.parse(rawMatch[1].trim()) as T;
  }

  throw new Error('Formato de resposta inválido da IA: não foi possível extrair JSON.');
}
