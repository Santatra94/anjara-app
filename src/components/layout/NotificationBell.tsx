'use client';

import { useNotifications } from '@/hooks/useNotifications';
import { useAuth } from '@/hooks/useAuth';
import { 
  Bell, 
  BellOff, 
  Smartphone, 
  Clock, 
  MessageSquare, 
  PackageCheck,
  RefreshCcw 
} from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export function NotificationBell() {
  const { user } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    isSubscribed, 
    isSupported, 
    subscribe, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications();

  // Ne montrer qu'au GERANT et ADMIN
  if (!user || (user.utilisateur.role !== 'GERANT' && user.utilisateur.role !== 'ADMIN')) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'LIVRAISON_VALIDEE': return <PackageCheck className="h-4 w-4 text-green-500" />;
      case 'RECOUVREMENT': return <RefreshCcw className="h-4 w-4 text-blue-500" />;
      default: return <MessageSquare className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] rounded-full border-2 border-white"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-8" onClick={markAllAsRead}>
              Tout lire
            </Button>
          )}
        </div>

        {!isSubscribed && isSupported && (
          <div className="p-3 bg-blue-50 border-b border-blue-100">
            <p className="text-[11px] text-blue-800 mb-2 leading-tight">
              Activer les notifications push pour faire vibrer votre telephone.
            </p>
            <Button size="sm" className="w-full h-8 text-xs bg-blue-600 hover:bg-blue-700" onClick={subscribe}>
              <Smartphone className="h-3 w-3 mr-2" /> Activer les alertes push
            </Button>
          </div>
        )}

        <ScrollArea className="h-[350px]">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground p-4 text-center">
              <BellOff className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-xs italic">Aucune notification pour le moment.</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-4 flex gap-3 transition-colors hover:bg-gray-50 cursor-pointer ${!n.lue ? 'bg-blue-50/30' : ''}`}
                  onClick={() => !n.lue && markAsRead(n.id)}
                >
                  <div className="mt-1">{getIcon(n.type)}</div>
                  <div className="flex-1 space-y-1">
                    <p className={`text-xs leading-snug ${!n.lue ? 'font-bold' : 'text-gray-600'}`}>
                      {n.titre}
                    </p>
                    <p className="text-[11px] text-gray-500 line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </div>
                  </div>
                  {!n.lue && (
                    <div className="h-2 w-2 rounded-full bg-blue-600 mt-2 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t text-center">
           <p className="text-[10px] text-gray-400 italic">Anjara Y&amp;J - Real-time alerts</p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
