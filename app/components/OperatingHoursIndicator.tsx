"use client";

import { useEffect, useState } from "react";
import { getOperatingHoursInfo } from "@/lib/schedule";

export default function OperatingHoursIndicator() {
  const [operatingInfo, setOperatingInfo] = useState(() => getOperatingHoursInfo());
  
  // Atualizar o status a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setOperatingInfo(getOperatingHoursInfo());
    }, 60000); // 60 segundos = 1 minuto
    
    return () => clearInterval(timer);
  }, []);
  
  return (
    <div className={`py-2 px-4 text-xs md:text-sm text-center ${operatingInfo.isOpen ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${operatingInfo.isOpen ? 'bg-success' : 'bg-warning'}`}></div>
        <span className="hidden sm:inline">{operatingInfo.message}</span>
        <span className="sm:hidden">
          {operatingInfo.isOpen 
            ? `Aberto - Fecha às 22h` 
            : `Fechado - Abre às ${operatingInfo.opensAt}`}
        </span>
      </div>
    </div>
  );
}
