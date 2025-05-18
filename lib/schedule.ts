/**
 * Funções para gerenciar o horário de funcionamento do sistema
 */

/**
 * Obtém a hora atual no fuso horário de Brasília (UTC-3)
 */
function getCurrentBrasiliaDate(): Date {
  // Cria um objeto Date representando o horário atual
  const now = new Date();
  
  // Ajusta para o fuso horário de Brasília (UTC-3)
  // O método toLocaleString com timezone 'America/Sao_Paulo' garante o horário correto 
  // independente de onde o servidor está hospedado
  const brasiliaTimeStr = now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  return new Date(brasiliaTimeStr);
}

/**
 * Verifica se o horário atual (em Brasília) está dentro do período de funcionamento (7h às 22h)
 */
export function isWithinOperatingHours(): boolean {
  const brasiliaDate = getCurrentBrasiliaDate();
  const hour = brasiliaDate.getHours();
  
  // Funcionamento entre 7h da manhã e 22h (10h da noite) no horário de Brasília
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
  const brasiliaDate = getCurrentBrasiliaDate();
  const hour = brasiliaDate.getHours();
  const isOpen = isWithinOperatingHours();
  
  // Formatando a hora atual no formato brasileiro
  const currentTime = brasiliaDate.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
  
  // Próxima abertura (no horário de Brasília)
  const nextOpenDate = new Date(brasiliaDate);
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
    month: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
  
  // Mensagem de status
  let message;
  if (isOpen) {
    message = `O sistema está disponível até às 22h (horário de Brasília). Hora atual: ${currentTime}`;
  } else {
    message = `O sistema está fechado. Funciona das 7h às 22h (horário de Brasília). Próxima abertura: ${nextOpenTime}. Hora atual: ${currentTime}`;
  }
  
  return {
    isOpen,
    opensAt: "07:00",
    closesAt: "22:00",
    nextOpenTime,
    message
  };
}

/**
 * Versão assíncrona da verificação de horário para uso com o servidor
 * Esta função é usada para verificar o horário do lado do servidor via API
 */
export async function isWithinOperatingHoursServer(): Promise<boolean> {
  try {
    // Aqui usamos uma API para verificar o horário do servidor
    // Para o escopo atual, vamos simplesmente usar a verificação local
    // Em um ambiente de produção real, isso poderia fazer uma chamada a um endpoint de API
    return isWithinOperatingHours();
  } catch (error) {
    console.error("Erro ao verificar horário do servidor:", error);
    // Em caso de erro, retornar a verificação local como fallback
    return isWithinOperatingHours();
  }
}

/**
 * Versão assíncrona de obtenção de informações do horário para uso com o servidor
 * Esta função retorna as informações do horário do servidor via API, incluindo o horário do servidor
 */
export async function getOperatingHoursInfoServer(): Promise<{
  isOpen: boolean;
  opensAt: string;
  closesAt: string;
  nextOpenTime: string;
  message: string;
  serverTime: string;
}> {
  try {
    // Em um ambiente de produção real, isso faria uma chamada à API
    // que retornaria o horário real do servidor
    const basicInfo = getOperatingHoursInfo();
    const brasiliaDate = getCurrentBrasiliaDate();
    
    // Formatando o horário do servidor no formato brasileiro (horário de Brasília)
    const serverTime = brasiliaDate.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo'
    });
    
    return {
      ...basicInfo,
      serverTime // Adicionando o horário do servidor (Brasília)
    };
  } catch (error) {
    console.error("Erro ao obter informações do servidor:", error);
    // Em caso de erro, retornar as informações locais como fallback
    const basicInfo = getOperatingHoursInfo();
    const brasiliaDate = getCurrentBrasiliaDate();
    
    return {
      ...basicInfo,
      serverTime: brasiliaDate.toLocaleTimeString('pt-BR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      })
    };
  }
}
