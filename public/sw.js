// Conniku Service Worker v8.0
// Full offline support + push notifications + background sync
// v8: Force full cache purge — footer eliminado, onboarding fix, portada móvil

const SW_VERSION = 'v8';
const CACHE_NAME = 'conniku-v8';
const STATIC_CACHE = 'conniku-static-v8';
const API_CACHE = 'conniku-api-v8';
const IMAGE_CACHE = 'conniku-images-v8';

// App shell files to precache (with cache-busting)
const APP_SHELL = [
  '/',
  '/offline.html',
  '/manifest.json?v=5',
  '/icon-192.png?v=5',
  '/icon-512.png?v=5',
  '/apple-touch-icon.png?v=5',
  '/favicon.ico?v=5',
];

// API base URL
const API_BASE = 'studyhub-api-bpco.onrender.com';

// ─── Install: precache app shell + force immediate activation ───
self.addEventListener('install', (event) => {
  console.log('[SW] Installing ' + SW_VERSION + ' — new Conniku logo');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())  // Force immediate activation
  );
});

// ─── Activate: DELETE ALL old caches, notify clients ────────────
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating ' + SW_VERSION + ' — purging ALL old caches');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);   // delete ALL caches unconditionally
          })
        )
      )
      .then(() => self.clients.claim())
      .then(() => {
        // Notify ALL open tabs — main.tsx will call window.location.reload()
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      })
      .then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'SW_UPDATED', version: SW_VERSION });
        });
      })
  );
});

// ─── Fetch: routing strategies ──────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip WebSocket, chrome-extension, etc.
  if (!url.protocol.startsWith('http')) return;

  // Skip external analytics/fonts CDN (let browser handle)
  if (url.hostname.includes('google-analytics') || url.hostname.includes('googletagmanager')) return;

  // API requests: Network First with cache fallback
  if (url.hostname === API_BASE) {
    event.respondWith(networkFirst(request, API_CACHE, 5000));
    return;
  }

  // Image requests: Cache First
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)$/)) {
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
    return;
  }

  // JS/CSS/Font assets (hashed by Vite): Cache First (immutable)
  if (url.pathname.match(/\/assets\/.*\.(js|css|woff2?)$/)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Google Fonts: Cache First
  if (url.hostname.includes('fonts.googleapis.com') || url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // KaTeX CSS: Cache First
  if (url.hostname.includes('cdn.jsdelivr.net') && url.pathname.includes('katex')) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // HTML navigation requests: Network First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(navigationHandler(request));
    return;
  }

  // Everything else: Stale While Revalidate
  event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
});

// ─── Caching strategies ─────────────────────────────────────────

async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    return new Response('', { status: 503, statusText: 'Offline' });
  }
}

async function networkFirst(request, cacheName, timeout = 5000) {
  const cache = await caches.open(cacheName);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: 'Sin conexion' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached);

  return cached || fetchPromise;
}

async function navigationHandler(request) {
  try {
    // Try network first for HTML
    const response = await fetch(request);
    // Cache the index.html for offline use
    const cache = await caches.open(STATIC_CACHE);
    cache.put('/', response.clone());
    return response;
  } catch (err) {
    // Try cached index.html (SPA - all routes serve index.html)
    const cached = await caches.match('/');
    if (cached) return cached;

    // Last resort: offline page
    const offline = await caches.match('/offline.html');
    if (offline) return offline;

    return new Response('<h1>Sin conexion</h1>', {
      status: 503,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

// ─── Push Notifications ─────────────────────────────────────────
self.addEventListener('push', (event) => {
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
    tag: data.tag || 'conniku-notification',
    renotify: true,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Conniku', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.navigate(url);
          return;
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ─── Background Sync (for queued messages) ──────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-pending-messages') {
    event.waitUntil(sendPendingMessages());
  }
});

async function sendPendingMessages() {
  try {
    const cache = await caches.open('conniku-pending');
    const requests = await cache.keys();

    for (const request of requests) {
      const cached = await cache.match(request);
      if (!cached) continue;

      const body = await cached.json();

      try {
        await fetch(request, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        await cache.delete(request);
      } catch (err) {
        console.log('[SW] Failed to send pending message, will retry');
      }
    }
  } catch (err) {
    console.error('[SW] Background sync failed:', err);
  }
}

// ─── Periodic cache cleanup ─────────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data === 'cleanCaches') {
    event.waitUntil(cleanOldCacheEntries());
  }
});

async function cleanOldCacheEntries() {
  // Limit API cache to 50 entries
  const apiCache = await caches.open(API_CACHE);
  const apiKeys = await apiCache.keys();
  if (apiKeys.length > 50) {
    for (let i = 0; i < apiKeys.length - 50; i++) {
      await apiCache.delete(apiKeys[i]);
    }
  }

  // Limit image cache to 100 entries
  const imgCache = await caches.open(IMAGE_CACHE);
  const imgKeys = await imgCache.keys();
  if (imgKeys.length > 100) {
    for (let i = 0; i < imgKeys.length - 100; i++) {
      await imgCache.delete(imgKeys[i]);
    }
  }
}
