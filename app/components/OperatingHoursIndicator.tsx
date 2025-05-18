"use client";

import { useEffect, useState } from "react";
import { getOperatingHoursInfo, getOperatingHoursInfoServer } from "@/lib/schedule";

export default function OperatingHoursIndicator() {
  const [operatingInfo, setOperatingInfo] = useState(() => getOperatingHoursInfo());
  const [isLoading, setIsLoading] = useState(true);
  const [serverTime, setServerTime] = useState<string | null>(null);
  
  // Função para buscar o horário do servidor
  const fetchServerTime = async () => {
    try {
      setIsLoading(true);
      const serverInfo = await getOperatingHoursInfoServer();
      setOperatingInfo(serverInfo);
      setServerTime(serverInfo.serverTime);
      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao buscar horário do servidor:", error);
      // Fallback para horário local
      setOperatingInfo(getOperatingHoursInfo());
      setIsLoading(false);
    }
  };
  
  // Carregar o horário do servidor ao montar o componente
  useEffect(() => {
    fetchServerTime();
    
    // Atualizar o status a cada minuto
    const timer = setInterval(() => {
      fetchServerTime();
    }, 60000); // 60 segundos = 1 minuto
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={`py-2 px-4 text-xs md:text-sm text-center ${operatingInfo.isOpen ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
      <div className="flex flex-wrap items-center justify-center gap-1">
        {isLoading ? (
          <span>Verificando horário do servidor...</span>
        ) : (
          <>
            <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${operatingInfo.isOpen ? 'bg-success' : 'bg-warning'}`}></div>
            <span className="hidden sm:inline">{operatingInfo.message}</span>
            <span className="sm:hidden">
              {operatingInfo.isOpen 
                ? `Aberto - Fecha às 22h (serv: ${serverTime})` 
                : `Fechado - Abre às ${operatingInfo.opensAt} (serv: ${serverTime})`}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
