// SW minimaliste - UNIQUEMENT push notifications
// Aucun cache, aucun fetch handler, aucun precache workbox
// Objectif : s'activer immediatement sans risque d'echec

self.addEventListener('install', function (event) {
  console.log('[SW-Push] Install');
  // Skip waiting = activation immediate
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  console.log('[SW-Push] Activate');
  // Claim tous les clients existants
  event.waitUntil(self.clients.claim());
});

// Reception d'une notification push
self.addEventListener('push', function (event) {
  console.log('[SW-Push] Push recu');

  let data = {
    title: 'Anjara Y&J',
    body: 'Nouvelle notification',
    url: '/',
    tag: 'anjara-default',
    donnees: {}
  };

  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'anjara-notification',
    requireInteraction: true,
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/',
      donnees: data.donnees || {}
    },
    actions: []
  };

  if (data.donnees && data.donnees.telephone && data.donnees.smsBody) {
    options.actions = [
      { action: 'sms', title: 'Envoyer SMS' },
      { action: 'open', title: 'Voir' }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', function (event) {
  console.log('[SW-Push] Clic notification', event.action);
  event.notification.close();

  const donnees = event.notification.data.donnees || {};
  const url = event.notification.data.url || '/';

  if (event.action === 'sms' && donnees.telephone && donnees.smsBody) {
    const smsUrl = 'sms:' + donnees.telephone + '?body=' + encodeURIComponent(donnees.smsBody);
    event.waitUntil(self.clients.openWindow(smsUrl));
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: url });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

self.addEventListener('notificationclose', function (event) {
  console.log('[SW-Push] Notification fermee');
});