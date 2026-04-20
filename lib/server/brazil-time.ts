import 'server-only';

const BRAZIL_TZ = 'America/Sao_Paulo';
const RAPID_API_HOST = 'world-time-api3.p.rapidapi.com';
const RAPID_API_DEFAULT_URL = `https://${RAPID_API_HOST}/ip`;
const WORLD_TIME_API_DEFAULT_URL = 'https://worldtimeapi.org/api/timezone/America/Sao_Paulo';
const ISO_DATETIME_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

export type BrazilNowResult = {
  now: Date;
  source: 'rapidapi' | 'worldtimeapi' | 'local';
  usedFallback: boolean;
};

function parseIsoFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const preferredKeys = [
    'datetime',
    'dateTime',
    'currentDateTime',
    'iso',
    'time',
    'utc_datetime',
    'localTime',
    'local_time',
  ];

  for (const key of preferredKeys) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === 'string' && ISO_DATETIME_REGEX.test(value)) {
      return value;
    }
  }

  for (const value of Object.values(payload)) {
    if (typeof value === 'string' && ISO_DATETIME_REGEX.test(value)) {
      return value;
    }
  }

  return null;
}

function parseIsoFromText(text: string): string | null {
  const match = text.match(ISO_DATETIME_REGEX);
  return match ? match[0] : null;
}

async function fetchFromRapidApi(): Promise<Date | null> {
  const apiKey =
    process.env.RAPIDAPI_KEY ||
    process.env.WORLD_TIME_API_KEY ||
    process.env.WORLD_TIME_RAPIDAPI_KEY;

  if (!apiKey) {
    return null;
  }

  const apiUrl =
    process.env.RAPIDAPI_WORLD_TIME_URL ||
    process.env.WORLD_TIME_API_URL ||
    RAPID_API_DEFAULT_URL;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'x-rapidapi-key': apiKey,
        'x-rapidapi-host': RAPID_API_HOST,
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    let isoString: string | null = null;

    if (contentType.includes('application/json')) {
      const payload = await response.json();
      isoString = parseIsoFromPayload(payload);
    } else {
      const text = await response.text();
      isoString = parseIsoFromText(text);
    }

    if (!isoString) {
      throw new Error('Não foi possível extrair o horário atualizado da resposta da RapidAPI.');
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Horário inválido recebido da RapidAPI: ${isoString}`);
    }

    return date;
  } catch (error) {
    console.error('Erro ao consultar o serviço de horário via RapidAPI:', error);
    return null;
  }
}

async function fetchFromWorldTimeApi(): Promise<Date | null> {
  try {
    const response = await fetch(WORLD_TIME_API_DEFAULT_URL, {
      headers: { 'cache-control': 'no-cache' },
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(`WorldTimeAPI request failed with status ${response.status}`);
    }

    const payload = await response.json();
    const isoString = typeof payload?.datetime === 'string' ? payload.datetime : null;
    if (!isoString) {
      throw new Error('WorldTimeAPI não retornou o campo datetime.');
    }

    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) {
      throw new Error(`Horário inválido recebido da WorldTimeAPI: ${isoString}`);
    }

    return date;
  } catch (error) {
    console.warn('Falha ao sincronizar horário com worldtimeapi:', error);
    return null;
  }
}

export async function getBrazilNow(): Promise<BrazilNowResult> {
  const rapidApiDate = await fetchFromRapidApi();
  if (rapidApiDate) {
    return {
      now: rapidApiDate,
      source: 'rapidapi',
      usedFallback: false,
    };
  }

  const worldTimeDate = await fetchFromWorldTimeApi();
  if (worldTimeDate) {
    return {
      now: worldTimeDate,
      source: 'worldtimeapi',
      usedFallback: false,
    };
  }

  return {
    now: new Date(),
    source: 'local',
    usedFallback: true,
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
