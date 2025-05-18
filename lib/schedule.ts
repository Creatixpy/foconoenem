/**
 * Funções para gerenciar o horário de funcionamento do sistema
 */

/**
 * Verifica se o horário atual está dentro do período de funcionamento (7h às 22h)
 */
export function isWithinOperatingHours(): boolean {
  const now = new Date();
  const hour = now.getHours();
  
  // Funcionamento entre 7h da manhã e 22h (10h da noite)
  return hour >= 7 && hour < 22;
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
  const isOpen = isWithinOperatingHours();
  
  // Formatando a hora atual no formato brasileiro
  const currentTime = now.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  
  // Próxima abertura
  const nextOpenDate = new Date();
  if (hour >= 22) {
    // Se já passou das 22h, a próxima abertura é às 7h do dia seguinte
    nextOpenDate.setDate(nextOpenDate.getDate() + 1);
    nextOpenDate.setHours(7, 0, 0, 0);
  } else if (hour < 7) {
    // Se é antes das 7h, a próxima abertura é às 7h do mesmo dia
    nextOpenDate.setHours(7, 0, 0, 0);
  }
  
  const nextOpenTime = nextOpenDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit'
  });
  
  // Mensagem de status
  let message;
  if (isOpen) {
    message = `O sistema está disponível até às 22h. Hora atual: ${currentTime}`;
  } else {
    message = `O sistema está fechado. Funciona das 7h às 22h. Próxima abertura: ${nextOpenTime}. Hora atual: ${currentTime}`;
  }
  
  return {
    isOpen,
    opensAt: "07:00",
    closesAt: "22:00",
    nextOpenTime,
    message
  };
}
