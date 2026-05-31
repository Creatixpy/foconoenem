import 'server-only';

const BRAZIL_TZ = 'America/Sao_Paulo';

export type BrazilNowResult = {
  now: Date;
  source: 'local';
  usedFallback: boolean;
};

export async function getBrazilNow(): Promise<BrazilNowResult> {
  return {
    now: new Date(),
    source: 'local',
    usedFallback: false,
  };
}

export function extractHourMinute(date: Date): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? '0');
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? '0');

  return { hour, minute };
}

export function formatBrazilTime(date: Date, options: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: BRAZIL_TZ,
    ...options,
  }).format(date);
}
