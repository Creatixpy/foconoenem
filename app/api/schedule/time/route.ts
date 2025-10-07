import { NextResponse } from "next/server";

const RAPID_API_HOST = "world-time-api3.p.rapidapi.com";
const DEFAULT_URL = `https://${RAPID_API_HOST}/ip`;
const ISO_DATETIME_REGEX = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?/;

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

export async function GET() {
  const apiKey =
    process.env.RAPIDAPI_KEY ||
    process.env.WORLD_TIME_API_KEY ||
    process.env.WORLD_TIME_RAPIDAPI_KEY;

  const apiUrl = process.env.WORLD_TIME_API_URL || DEFAULT_URL;

  if (!apiKey) {
    console.error("Chave da RapidAPI não configurada. Defina RAPIDAPI_KEY ou WORLD_TIME_API_KEY.");
    return NextResponse.json(
      {
        datetime: new Date().toISOString(),
        fallback: true,
        error: "RapidAPI key not configured",
      },
      { status: 500 }
    );
  }

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
      throw new Error("Não foi possível extrair o horário atualizado da resposta da RapidAPI.");
    }

    return NextResponse.json({ datetime: isoString, source: "rapidapi" });
  } catch (error) {
    console.error("Erro ao consultar o serviço de horário via RapidAPI:", error);

    return NextResponse.json(
      {
        datetime: new Date().toISOString(),
        fallback: true,
        error: "Failed to fetch remote time",
      },
      { status: 200 }
    );
  }
}
