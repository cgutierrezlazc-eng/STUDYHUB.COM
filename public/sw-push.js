// Service Worker for Push Notifications - Conniku
self.addEventListener('push', function(event) {
  let data = { title: 'Conniku', body: 'Tienes una nueva notificacion', url: '/' };

  try {
    data = event.data.json();
  } catch (e) {
    console.log('[SW] Could not parse push data');
  }

  const options = {
    body: data.body || '',
    icon: data.icon || '/icon-192.png',
    badge: data.badge || '/icon-72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'dismiss', title: 'Cerrar' },
    ],
    tag: 'conniku-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Conniku', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let client of clientList) {
        if (client.url.includes('conniku') && 'focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});
