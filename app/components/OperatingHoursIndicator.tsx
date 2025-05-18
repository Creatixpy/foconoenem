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
    <div className={`py-2 px-4 text-sm text-center ${operatingInfo.isOpen ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
      <div className="flex items-center justify-center">
        <div className={`w-3 h-3 rounded-full mr-2 ${operatingInfo.isOpen ? 'bg-success' : 'bg-warning'}`}></div>
        <span>{operatingInfo.message}</span>
      </div>
    </div>
  );
}
