'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

// Helper pour convertir la cle VAPID publique
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

// Helper : obtenir un SW enregistre (register si besoin, avec timeout)
async function getServiceWorkerRegistration(): Promise<ServiceWorkerRegistration> {
  // 1. Essayer les enregistrements existants
  const existing = await navigator.serviceWorker.getRegistration();
  if (existing) {
    console.log('[Push] SW deja enregistre:', existing.scope);
    return existing;
  }

  // 2. Si aucun, forcer l'enregistrement
  console.log('[Push] Aucun SW trouve, enregistrement manuel...');
  const registration = await navigator.serviceWorker.register('/sw.js', {
    scope: '/',
  });
  console.log('[Push] SW enregistre:', registration.scope);

  // 3. Attendre qu'il soit pret (avec timeout 10s)
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('SW activation timeout')), 10000);
    if (registration.active) {
      clearTimeout(timeout);
      resolve();
      return;
    }
    const sw = registration.installing || registration.waiting;
    if (sw) {
      sw.addEventListener('statechange', () => {
        if (sw.state === 'activated') {
          clearTimeout(timeout);
          resolve();
        }
      });
    } else {
      clearTimeout(timeout);
      resolve();
    }
  });

  return registration;
}

export function useNotifications() {
  const { user } = useAuth();
  const supabase = createClient();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Recuperer les notifications de la societe
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

    // Verifier si deja abonne (sans bloquer)
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        registration.pushManager.getSubscription().then((subscription) => {
          setIsSubscribed(!!subscription);
        });
      }
    });
  }, []);

  const subscribe = async () => {
    console.log('[Push] subscribe() appele');

    if (!isSupported) {
      toast.error("Navigateur non compatible avec les notifications push");
      return;
    }

    // Verifier cle VAPID au tout debut
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) {
      console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY manquante');
      toast.error("Configuration serveur manquante (VAPID)");
      return;
    }

    try {
      // 1. Demander permission AVANT le SW (feedback immediat utilisateur)
      toast.info("Demande de permission en cours...");
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') {
        toast.error("Permission refusee. Autorisez dans les parametres du navigateur.");
        return;
      }

      // 2. Obtenir/enregistrer le Service Worker
      toast.info("Preparation du service worker...");
      const registration = await getServiceWorkerRegistration();

      // 3. Creer la subscription push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      console.log('[Push] Subscription creee:', subscription.endpoint);

      // 4. Envoyer a notre API
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
        throw new Error("API subscribe failed: " + errText);
      }

      setIsSubscribed(true);
      toast.success("Notifications activees ! Votre telephone vibrera pour chaque livraison. 📳");
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error('[Push] Erreur subscribe:', msg, error);
      toast.error("Echec activation: " + msg);
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