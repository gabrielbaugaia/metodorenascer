// Service Worker para Push Notifications e Cache
const CACHE_NAME = 'renascer-cache-v3';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico'
];

// Cache static assets on install
self.addEventListener('install', function(event) {
  console.log('[SW] Instalado');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Ativado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== CACHE_NAME;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    }).then(function() {
      return clients.claim();
    })
  );
});

// Cache-first strategy for static assets, network-first for API calls
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API calls and external requests
  if (url.pathname.includes('/rest/') || 
      url.pathname.includes('/auth/') ||
      url.hostname.includes('supabase.co') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    return;
  }
  
  // Cache-first for static assets (images, JS, CSS)
  if (url.pathname.includes('/assets/') || 
      url.pathname.endsWith('.js') || 
      url.pathname.endsWith('.css') ||
      url.pathname.endsWith('.png') ||
      url.pathname.endsWith('.jpg') ||
      url.pathname.endsWith('.jpeg') ||
      url.pathname.endsWith('.webp') ||
      url.pathname.endsWith('.ico')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(function(cache) {
        return cache.match(event.request).then(function(cachedResponse) {
          if (cachedResponse) {
            // Return cached response and update cache in background
            fetch(event.request).then(function(networkResponse) {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(event.request, networkResponse.clone());
              }
            }).catch(function() {});
            return cachedResponse;
          }
          // Not in cache, fetch from network and cache
          return fetch(event.request).then(function(networkResponse) {
            if (networkResponse && networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // Network-first for HTML pages
  if (event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(networkResponse) {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(function(cache) {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(function() {
          return caches.match(event.request);
        })
    );
    return;
  }
});

// Push notification handlers
self.addEventListener('push', function(event) {
  console.log('[SW] Push recebido:', event);
  
  let data = {
    title: 'Método Renascer',
    body: 'Você tem uma nova notificação!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'default'
  };
  
  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }
  
  const options = {
    body: data.body,
    icon: data.icon || '/favicon.ico',
    badge: data.badge || '/favicon.ico',
    tag: data.tag || 'default',
    data: data.data || {},
    vibrate: [100, 50, 100],
    actions: data.actions || []
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notificação clicada:', event);
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/area-cliente';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clientList) {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(urlToOpen);
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
