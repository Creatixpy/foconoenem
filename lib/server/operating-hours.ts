'use server';

import { extractHourMinute, formatBrazilTime, getBrazilNow } from '@/lib/server/brazil-time';

const OPEN_HOUR = 7;
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

function evaluateOperatingHours(date: Date): boolean {
  const { hour, minute } = extractHourMinute(date);
  if (hour < OPEN_HOUR) return false;
  if (hour > CLOSE_HOUR) return false;
  if (hour === CLOSE_HOUR && minute >= CLOSE_MINUTE) return false;
  return true;
}

export async function getOperatingHoursInfo(): Promise<OperatingHoursInfo> {
  const { now, usedFallback } = await getBrazilNow();
  const isOpen = evaluateOperatingHours(now);

  const { hour, minute } = extractHourMinute(now);
  const minutesSinceMidnight = hour * 60 + minute;
  const openMinutes = OPEN_HOUR * 60;
  const closeMinutes = CLOSE_HOUR * 60 + CLOSE_MINUTE;

  let referenceTime = new Date(now);

  if (isOpen) {
    const diffMinutes = closeMinutes - minutesSinceMidnight;
    referenceTime = new Date(now.getTime() + diffMinutes * 60 * 1000);
  } else if (minutesSinceMidnight < openMinutes) {
    const diffMinutes = openMinutes - minutesSinceMidnight;
    referenceTime = new Date(now.getTime() + diffMinutes * 60 * 1000);
  } else {
    const minutesUntilNextDayOpen = 24 * 60 - minutesSinceMidnight + openMinutes;
    referenceTime = new Date(now.getTime() + minutesUntilNextDayOpen * 60 * 1000);
  }

  const currentTime = formatBrazilTime(now, { hour: '2-digit', minute: '2-digit' });
  const nextOpenTime = formatBrazilTime(referenceTime, {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

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
