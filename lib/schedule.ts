/**
 * Funções para gerenciar o horário de funcionamento do sistema
 */

/**
 * Verifica se o horário atual está dentro do período de funcionamento (7h às 23h30)
 */
export function isWithinOperatingHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();

  if (hour < 7) {
    return false;
  }

  if (hour > 23) {
    return false;
  }

  if (hour === 23 && minute >= 30) {
    return false;
  }

  return true;
}

/**
 * Retorna um objeto com informações sobre o horário de funcionamento
 */
export function getOperatingHoursInfo(): {
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
} {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  const isOpen = isWithinOperatingHours();
  
  // Formatando a hora atual no formato brasileiro
  const currentTime = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Próxima abertura
  const nextOpenDate = new Date();
  if (hour > 23 || (hour === 23 && minute >= 30)) {
    // Se já passou das 23h30, a próxima abertura é às 7h do dia seguinte
    nextOpenDate.setDate(nextOpenDate.getDate() + 1);
    nextOpenDate.setHours(7, 0, 0, 0);
  } else if (hour < 7) {
    // Se é antes das 7h, a próxima abertura é às 7h do mesmo dia
    nextOpenDate.setHours(7, 0, 0, 0);
  } else {
    // Já estamos abertos, indicar fechamento às 23h30 do mesmo dia
    nextOpenDate.setHours(23, 30, 0, 0);
  }
  
  const nextOpenTime = nextOpenDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
  
  // Mensagem de status
  let message: string;
  if (isOpen) {
    message = `Sistema disponível agora. Atendemos até às 23h30 · Hora atual: ${currentTime}`;
  } else {
    message = `Sistema indisponível no momento · Funcionamos das 7h às 23h30 · Próxima abertura: ${nextOpenTime} · Hora atual: ${currentTime}`;
  }
  
  return {
    isOpen,
    opensAt: "07:00",
    closesAt: "23:30",
    nextOpenTime,
    message
  };
}
