"use client";

import { useEffect, useState } from "react";
import { getOperatingHoursInfo, type OperatingHoursInfo } from "@/lib/schedule";

export default function OperatingHoursIndicator() {
  const [operatingInfo, setOperatingInfo] = useState<OperatingHoursInfo | null>(null);

  useEffect(() => {
    let cancelled = false;

    const refreshInfo = async () => {
      try {
        const info = await getOperatingHoursInfo();
        if (!cancelled) {
          setOperatingInfo(info);
        }
      } catch (error) {
        console.error("Não foi possível atualizar o horário de funcionamento:", error);
      }
    };

    void refreshInfo();

    const timer = setInterval(() => {
      void refreshInfo();
    }, 60000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  if (!operatingInfo) {
    return (
      <div className="py-2 px-4 text-xs md:text-sm text-center bg-blue-900/20 text-blue-100">
        Sincronizando horário de funcionamento...
      </div>
    );
  }

  return (
    <div className={`py-2 px-4 text-xs md:text-sm text-center ${operatingInfo.isOpen ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
      <div className="flex flex-wrap items-center justify-center gap-1">
        <div className={`w-2 h-2 md:w-3 md:h-3 rounded-full ${operatingInfo.isOpen ? "bg-success" : "bg-warning"}`}></div>
        <span className="hidden sm:inline">{operatingInfo.message}</span>
        <span className="sm:hidden">
          {operatingInfo.isOpen
            ? `Aberto - Fecha às ${operatingInfo.closesAt}`
            : `Fechado - Abre às ${operatingInfo.opensAt}`}
        </span>
      </div>
    </div>
  );
}
