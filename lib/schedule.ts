import { DateTime } from 'luxon';

const BRAZIL_TIMEZONE = 'America/Sao_Paulo';
const OPEN_HOUR = 7;
const OPEN_MINUTE = 0;
const CLOSE_HOUR = 23;
const CLOSE_MINUTE = 30;

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

async function getBrazilianNow(): Promise<TimeResult> {
  return {
    now: DateTime.now().setZone(BRAZIL_TIMEZONE),
    usedFallback: false,
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

  const currentTime = now.toFormat('HH:mm');
  const nextOpenTime = referenceTime.toFormat('dd/MM HH:mm');

  const baseMessage = isOpen
    ? `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`
    : `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`;

  return {
    isOpen,
    opensAt: '07:00',
    closesAt: '23:30',
    nextOpenTime,
    message: baseMessage,
    currentTime,
    usedFallback,
  };
}
