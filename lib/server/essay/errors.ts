import 'server-only';

export class EssayServiceError extends Error {
  constructor(public readonly kind: 'theme_not_found' | 'unavailable', message: string) {
    super(message);
    this.name = 'EssayServiceError';
  }
}
