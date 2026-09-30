export type OperatingHoursInfo = {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  currentTime: string;
  usedFallback: boolean;
};

export function calculateOperatingHours(now: Date, usedFallback = false): OperatingHoursInfo {
  const format = (date: Date, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('pt-BR', {
    ...options, timeZone: 'America/Sao_Paulo', hour12: false,
  }).format(date);
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const hour = Number(parts.find((part) => part.type === 'hour')?.value ?? 0);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value ?? 0);
  const minutes = hour * 60 + minute;
  const isOpen = minutes >= 7 * 60 && minutes < 23 * 60 + 30;
  const targetMinutes = isOpen ? 23 * 60 + 30 : minutes < 7 * 60 ? 7 * 60 : 24 * 60 + 7 * 60;
  const referenceTime = new Date(now.getTime() + (targetMinutes - minutes) * 60_000);
  const currentTime = format(now, { hour: '2-digit', minute: '2-digit' });
  const nextOpenTime = format(referenceTime, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  return {
    isOpen, opensAt: '07:00', closesAt: '23:30', nextOpenTime, currentTime, usedFallback,
    message: isOpen
      ? `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`
      : `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`,
  };
}
