export type OperatingHoursAccess = {
  userId: string;
  expiresAt: string;
};

export type OperatingHoursInfo = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  currentTime: string;
  usedFallback: boolean;
  unrestrictedAccess?: OperatingHoursAccess;
};

export function calculateOperatingHours(
  now: Date,
  usedFallback = false,
  access?: OperatingHoursAccess,
): OperatingHoursInfo {
  const format = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', {
    ...options, timeZone: 'America/Sao_Paulo', hour12: false,
  }).format(date);
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const minutes = hour * 60 + minute;
  const scheduledOpen = minutes >= 7 * 60 && minutes < 23 * 60 + 30;
  const unrestrictedAccess = access && Date.parse(access.expiresAt) > now.getTime() ? access : undefined;
  const isOpen = Boolean(unrestrictedAccess) || scheduledOpen;
  const targetMinutes = scheduledOpen ? 23 * 60 + 30 : minutes < 7 * 60 ? 7 * 60 : 24 * 60 + 7 * 60;
  const referenceTime = new Date(now.getTime() + (targetMinutes - minutes) * 60_000);
  const currentTime = format(now, { hour: '2-digit', minute: '2-digit' });
  const nextOpenTime = format(referenceTime, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return {
    isOpen, opensAt: '07:00', closesAt: '23:30', nextOpenTime, currentTime, usedFallback,
    ...(unrestrictedAccess ? { unrestrictedAccess } : {}),
    message: unrestrictedAccess
      ? `Plano Max disponível 24 horas · Hora atual: ${currentTime}`
      : isOpen
      ? `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`
      : `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`,
  };
}

export function operatingHoursForUser(initial: OperatingHoursInfo, userId: string | undefined, now: Date) {
  const access = initial.unrestrictedAccess?.userId === userId ? initial.unrestrictedAccess : undefined;
  return calculateOperatingHours(now, initial.usedFallback, access);
}
