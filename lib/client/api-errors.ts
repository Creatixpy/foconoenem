export type ApiProblemKind = 'session' | 'limit' | 'expired' | 'in_progress' | 'off_topic' | 'unavailable' | 'invalid';

export class ApiError extends Error {
  constructor(message: string, public readonly kind: ApiProblemKind, public readonly retryAt: number | null = null) {
    super(message);
    this.name = 'ApiError';
  }
}

function field(payload: unknown, name: string): string {
  if (!payload || typeof payload !== 'object' || !(name in payload)) return '';
  const value = (payload as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : '';
}

export function retryAtFromResponse(response: Pick<Response, 'headers'>, payload: unknown, now = Date.now()): number {
  const resetAt = Date.parse(field(payload, 'resetAt'));
  const header = response.headers.get('Retry-After');
  const headerTime = header ? (/^\d+$/.test(header) ? now + Number(header) * 1_000 : Date.parse(header)) : NaN;
  const candidates = [resetAt, headerTime].filter((time) => Number.isFinite(time) && time > now);
  return candidates.length ? Math.max(...candidates) : now + 60_000;
}

export function apiError(response: Pick<Response, 'status' | 'headers'>, payload: unknown, fallback: string): ApiError {
  const code = field(payload, 'error');
  if (response.status === 401) return new ApiError('Sua sessão expirou. Entre novamente para continuar. Seu trabalho foi preservado.', 'session');
  if (response.status === 429) return new ApiError('Você atingiu o limite de tentativas. Aguarde antes de tentar novamente.', 'limit', retryAtFromResponse(response, payload));
  if (code === 'quiz_expired' || code === 'quiz_not_found' || response.status === 410) return new ApiError('Este simulado expirou ou não está mais disponível. Comece um novo simulado.', 'expired');
  if (code === 'submission_in_progress') return new ApiError('Sua redação ainda está sendo processada. Aguarde um pouco e tente consultar a correção novamente.', 'in_progress');
  if (code === 'off_topic') {
    const justification = field(payload, 'justification').trim();
    return new ApiError(`Sua redação não aborda diretamente o tema proposto.${justification ? ` ${justification}` : ''} Revise o texto antes de enviar novamente.`, 'off_topic');
  }
  if (code === 'theme_not_found') return new ApiError('O tema selecionado não está mais disponível. Gere outro tema ou escolha um tema manual. Sua redação foi mantida.', 'invalid');
  if (code === 'outside_operating_hours') return new ApiError('O atendimento funciona das 7h às 23h30, no horário de Brasília. Seu trabalho foi mantido para continuar depois.', 'unavailable');
  if (code === 'submission_conflict' || code === 'request_conflict' || code === 'quiz_conflict') return new ApiError('Não foi possível confirmar este envio. Recarregue a página para recuperar seu trabalho e tente novamente.', 'invalid');
  if (response.status >= 500 || response.status === 408) return new ApiError(fallback, 'unavailable');
  return new ApiError(fallback, 'invalid');
}

export function failureMessage(failure: unknown, fallback = 'Não foi possível conectar. Verifique sua conexão e tente novamente.'): string {
  return failure instanceof ApiError ? failure.message : fallback;
}
