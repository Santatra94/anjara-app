'use client';

import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff } from "lucide-react";

export function IndicateurReseau() {
  const isOnline = useOnlineStatus();

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-colors shadow-sm",
      isOnline ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
    )}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3" /> En ligne
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3" /> Hors ligne
        </>
      )}
    </div>
  );
}
