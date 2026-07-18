// worker/index.js
// Ce fichier est automatiquement fusionne avec le Service Worker de next-pwa
// Il gere UNIQUEMENT les push notifications - le reste (cache PWA) est gere par next-pwa

// Reception d'une notification push
self.addEventListener('push', function (event) {
  console.log('[SW] Push recu');

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

  // Ajouter des actions selon le type
  if (data.donnees && data.donnees.telephone && data.donnees.smsBody) {
    options.actions = [
      {
        action: 'sms',
        title: 'Envoyer SMS'
      },
      {
        action: 'open',
        title: 'Voir'
      }
    ];
  }

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Clic sur la notification
self.addEventListener('notificationclick', function (event) {
  console.log('[SW] Clic notification', event.action);
  event.notification.close();

  const donnees = event.notification.data.donnees || {};
  const url = event.notification.data.url || '/';

  // Action "Envoyer SMS" : ouvre l'app SMS native
  if (event.action === 'sms' && donnees.telephone && donnees.smsBody) {
    const smsUrl = 'sms:' + donnees.telephone + '?body=' + encodeURIComponent(donnees.smsBody);
    event.waitUntil(
      self.clients.openWindow(smsUrl)
    );
    return;
  }

  // Action "Voir" OU clic sur le corps de la notif : ouvre l'app
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Si l'app est deja ouverte, la focus et navigue
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', url: url });
          return client.focus();
        }
      }
      // Sinon, ouvre une nouvelle fenetre
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Fermeture de la notification
self.addEventListener('notificationclose', function (event) {
  console.log('[SW] Notification fermee');
});
