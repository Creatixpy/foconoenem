import { Buffer } from "node:buffer";

/**
 * Extrai o ID do usuário (sub) de um token JWT do Supabase.
 * Retorna null se o token for inválido ou não contiver as informações esperadas.
 */
export function extractUserIdFromToken(token: string | null | undefined): string | null {
  if (!token) {
    return null;
  }

  try {
    const parts = token.split(".");
    if (parts.length < 2) {
      return null;
    }

    const payloadSegment = parts[1];
    const payloadJson = Buffer.from(payloadSegment, "base64url").toString("utf8");
    const payload = JSON.parse(payloadJson);

    return payload?.sub ?? payload?.user_id ?? null;
  } catch (error) {
    console.error("Failed to decode Supabase JWT:", error);
    return null;
  }
}
