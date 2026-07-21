'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Enregistrer notre SW dedie push (public/sw-push.js)
// Scope /push/ = ne conflicte PAS avec /sw.js de next-pwa
async function registerPushServiceWorker(): Promise<ServiceWorkerRegistration> {
  // 1. Chercher un enregistrement existant sur notre scope dedie
  const registrations = await navigator.serviceWorker.getRegistrations();
  const existing = registrations.find(r => r.active?.scriptURL.includes('sw-push.js'));
  if (existing && existing.active) {
    console.log('[Push] SW-Push deja actif');
    return existing;
  }

  // 2. Enregistrer notre SW push
  console.log('[Push] Enregistrement sw-push.js...');
  const registration = await navigator.serviceWorker.register('/sw-push.js', {
    scope: '/',
    updateViaCache: 'none',
  });

  // 3. Attendre activation (avec timeout 15s)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Timeout activation SW-Push (15s)'));
    }, 15000);

    if (registration.active) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    const sw = registration.installing || registration.waiting;
    if (!sw) {
      clearTimeout(timeout);
      resolve();
      return;
    }

    sw.addEventListener('statechange', () => {
      console.log('[Push] SW state:', sw.state);
      if (sw.state === 'activated') {
        clearTimeout(timeout);
        resolve();
      }
      if (sw.state === 'redundant') {
        clearTimeout(timeout);
        reject(new Error('SW devenu REDUNDANT pendant installation'));
      }
    });
  });

  console.log('[Push] SW-Push actif');
  return registration;
}

export function useNotifications() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  const { data: notifications, mutate, isLoading } = useSWR(
    user?.societe?.id ? `notifications-${user.societe.id}` : null,
    async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    },
    { refreshInterval: 30000 }
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setIsSupported(true);
    setPermission(Notification.permission);

    navigator.serviceWorker.getRegistrations().then((registrations) => {
      const pushSW = registrations.find(r => r.active?.scriptURL.includes('sw-push.js'));
      if (pushSW) {
        pushSW.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      }
    });
  }, []);

  const subscribe = async () => {
    console.log('[Push] subscribe() appele');

    if (!isSupported) {
      toast.error("Navigateur non compatible");
      return;
    }

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('[Push] VAPID key manquante');
      toast.error("Configuration serveur manquante");
      return;
    }

    try {
      toast.info("Demande de permission...");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        toast.error("Permission refusee");
        return;
      }

      toast.info("Activation du service worker...");
      const registration = await registerPushServiceWorker();

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      console.log('[Push] Subscription:', subscription.endpoint);

      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error("API subscribe: " + errText);
      }

      setIsSubscribed(true);
      toast.success("Notifications activees ! 📳");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Push] Erreur:', msg, error);
      toast.error("Echec: " + msg);
    }
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('notifications')
      .update({ lue: true })
      .eq('id', id);
    if (!error) mutate();
  };

  const markAllAsRead = async () => {
    if (!user?.societe?.id) return;
    const { error } = await supabase
      .from('notifications')
      .update({ lue: true })
      .eq('societe_id', user.societe.id)
      .eq('lue', false);
    if (!error) mutate();
  };

  return {
    notifications: notifications || [],
    unreadCount: (notifications || []).filter((n) => !n.lue).length,
    isSupported,
    isSubscribed,
    permission,
    isLoading,
    subscribe,
    markAsRead,
    markAllAsRead,
    refresh: mutate,
  };
}