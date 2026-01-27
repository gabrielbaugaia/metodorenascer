// Service Worker para Push Notifications e Cache
// v5: fix tela preta - força update imediato e notifica clientes
const CACHE_NAME = 'renascer-cache-v5';
const STATIC_ASSETS = [
  '/',
  '/favicon.ico'
];

// Cache static assets on install
self.addEventListener('install', function(event) {
  console.log('[SW] Instalando v5');
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force immediate activation
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  console.log('[SW] Ativando v5 - limpando caches antigos');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== CACHE_NAME;
          })
          .map(function(name) {
            console.log('[SW] Deletando cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(function() {
      return clients.claim();
    }).then(function() {
      // Notify all clients to reload
      return clients.matchAll({ type: 'window' }).then(function(windowClients) {
        windowClients.forEach(function(client) {
          client.postMessage({ type: 'SW_UPDATED', version: 'v5' });
        });
      });
    })
  );
});

// Allow the app to request immediate activation (extra safety)
self.addEventListener('message', function(event) {
  if (event?.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
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

  const acceptHeader = event.request.headers.get('accept') || '';
  const isHtml = acceptHeader.includes('text/html');
  const isScriptOrStyle =
    url.pathname.includes('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css');

  const isImage =
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.jpeg') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.ico');

  // Network-first for JS/CSS bundles (avoid stale broken bundles)
  if (isScriptOrStyle) {
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
  
  // Cache-first (stale-while-revalidate) for images
  if (isImage) {
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
  if (isHtml) {
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
