import { DateTime } from "luxon";

const BRAZIL_TIMEZONE = "America/Sao_Paulo";
const OPEN_HOUR = 7;
const OPEN_MINUTE = 0;
const CLOSE_HOUR = 23;
const CLOSE_MINUTE = 30;
const INTERNAL_TIME_ENDPOINT = "/api/schedule/time";
const RAPID_API_HOST = "world-time-api3.p.rapidapi.com";
const RAPID_API_DEFAULT_URL = `https://${RAPID_API_HOST}/ip`;
const ISO_DATETIME_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

export type OperatingHoursInfo = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  currentTime: string;
  usedFallback: boolean;
};

type TimeResult = {
  now: DateTime;
  usedFallback: boolean;
};

function parseIsoFromPayload(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const preferredKeys = [
    "datetime",
    "dateTime",
    "currentDateTime",
    "iso",
    "time",
    "utc_datetime",
    "localTime",
    "local_time",
  ];

  for (const key of preferredKeys) {
    const value = (payload as Record<string, unknown>)[key];
    if (typeof value === "string" && ISO_DATETIME_REGEX.test(value)) {
      return value;
    }
  }

  for (const value of Object.values(payload)) {
    if (typeof value === "string" && ISO_DATETIME_REGEX.test(value)) {
      return value;
    }
  }

  return null;
}

function parseIsoFromText(text: string): string | null {
  const match = text.match(ISO_DATETIME_REGEX);
  return match ? match[0] : null;
}

async function fetchIsoFromRapidApi(): Promise<TimeResult | null> {
  const apiKey =
    process.env.RAPIDAPI_KEY ||
    process.env.WORLD_TIME_API_KEY ||
    process.env.WORLD_TIME_RAPIDAPI_KEY;

  if (!apiKey) {
    return null;
  }

  const apiUrl = process.env.WORLD_TIME_API_URL || RAPID_API_DEFAULT_URL;

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-rapidapi-key": apiKey,
        "x-rapidapi-host": RAPID_API_HOST,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`RapidAPI request failed with status ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    let isoString: string | null = null;

    if (contentType.includes("application/json")) {
      const payload = await response.json();
      isoString = parseIsoFromPayload(payload);
    } else {
      const text = await response.text();
      isoString = parseIsoFromText(text);
    }

    if (!isoString) {
      throw new Error("Não foi possível extrair o horário atualizado da resposta do serviço externo.");
    }

    const dateTime = DateTime.fromISO(isoString, { zone: BRAZIL_TIMEZONE });

    if (!dateTime.isValid) {
      throw new Error(`Horário inválido recebido do serviço externo: ${isoString}`);
    }

    return {
      now: dateTime,
      usedFallback: false,
    };
  } catch (error) {
    console.error("Erro ao consultar o serviço de horário via RapidAPI:", error);
    return null;
  }
}

async function fetchFromInternalEndpoint(): Promise<TimeResult | null> {
  if (typeof fetch === "undefined") {
    return null;
  }

  let timeout: ReturnType<typeof setTimeout> | null = null;
  let controller: AbortController | undefined;

  try {
    controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;

    if (controller) {
      const abortController = controller;
      timeout = setTimeout(() => abortController.abort("timeout"), 4000);
    } else {
      timeout = null;
    }

    const response = await fetch(INTERNAL_TIME_ENDPOINT, {
      method: "GET",
      cache: "no-store",
      signal: controller?.signal,
    });

    if (!response.ok) {
      console.warn(`Endpoint interno respondeu com status ${response.status}`);
      return null;
    }

    const payload = await response.json().catch((error) => {
      console.warn("Não foi possível interpretar a resposta do endpoint interno:", error);
      return null;
    });

    if (!payload) {
      return null;
    }

    const isoString = typeof payload?.datetime === "string" ? payload.datetime : null;

    if (!isoString) {
      console.warn("Endpoint interno não retornou o campo 'datetime'.");
      return null;
    }

    const dateTime = DateTime.fromISO(isoString, { zone: BRAZIL_TIMEZONE });

    if (!dateTime.isValid) {
      console.warn(`Horário inválido recebido do endpoint interno: ${isoString}`);
      return null;
    }

    return {
      now: dateTime,
      usedFallback: Boolean(payload?.fallback),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      console.warn("Consulta ao endpoint interno de horário expirou antes da resposta.");
    } else {
      console.error("Erro ao consultar o endpoint interno de horário:", error);
    }
    return null;
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

async function getBrazilianNow(): Promise<TimeResult> {
  if (typeof window === "undefined") {
    const rapidApiResult = await fetchIsoFromRapidApi();
    if (rapidApiResult) {
      return rapidApiResult;
    }
    return {
      now: DateTime.now().setZone(BRAZIL_TIMEZONE),
      usedFallback: true,
    };
  }

  const internalResult = await fetchFromInternalEndpoint();

  if (internalResult) {
    return internalResult;
  }

  const rapidApiResult = await fetchIsoFromRapidApi();

  if (rapidApiResult) {
    return rapidApiResult;
  }

  return {
    now: DateTime.now().setZone(BRAZIL_TIMEZONE),
    usedFallback: true,
  };
}

function evaluateOperatingHours(dateTime: DateTime): boolean {
  if (dateTime.hour < OPEN_HOUR) {
    return false;
  }

  if (dateTime.hour > CLOSE_HOUR) {
    return false;
  }

  if (dateTime.hour === CLOSE_HOUR && dateTime.minute >= CLOSE_MINUTE) {
    return false;
  }

  return true;
}

export async function isWithinOperatingHours(dateTime?: DateTime): Promise<boolean> {
  if (dateTime) {
    return evaluateOperatingHours(dateTime);
  }

  const { now } = await getBrazilianNow();
  return evaluateOperatingHours(now);
}

export async function getOperatingHoursInfo(): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilianNow();
  const isOpen = evaluateOperatingHours(now);

  const openingTimeToday = now.set({
    hour: OPEN_HOUR,
    minute: OPEN_MINUTE,
    second: 0,
    millisecond: 0,
  });

  const closingTimeToday = now.set({
    hour: CLOSE_HOUR,
    minute: CLOSE_MINUTE,
    second: 0,
    millisecond: 0,
  });

  let referenceTime = openingTimeToday;

  if (isOpen) {
    referenceTime = closingTimeToday;
  } else if (now < openingTimeToday) {
    referenceTime = openingTimeToday;
  } else {
    referenceTime = openingTimeToday.plus({ days: 1 });
  }

  const currentTime = now.toFormat("HH:mm");
  const nextOpenTime = referenceTime.toFormat("dd/MM HH:mm");

  const baseMessage = isOpen
    ? `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`
    : `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`;

  const message = usedFallback
    ? `${baseMessage} · Atualizado com horário local (falha na sincronização com o serviço externo).`
    : baseMessage;

  return {
    isOpen,
    opensAt: "07:00",
    closesAt: "23:30",
    nextOpenTime,
    message,
    currentTime,
    usedFallback,
  };
}
