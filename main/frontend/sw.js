/**
 * Digital Twin PoC - Service Worker
 * Caché básico para archivos estáticos (HTML, CSS, JS) - Estrategia Cache First
 * Versión: 1.0.0
 */

const CACHE_NAME = 'digital-twin-poc-v1';
const STATIC_CACHE_NAME = 'digital-twin-static-v1';
const DYNAMIC_CACHE_NAME = 'digital-twin-dynamic-v1';

// Archivos estáticos a cachear en la instalación
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/dashboard.html',
  '/css/styles.css',
  '/js/app.js',
  '/js/sw-register.js',
  '/manifest.webmanifest',
  '/assets/icon.svg',
  '/assets/icon-192.png',
  '/assets/icon-512.png'
];

// Estrategias de caché
const CACHE_STRATEGIES = {
  // Cache First: Para assets estáticos (CSS, JS, imágenes)
  CACHE_FIRST: 'cache-first',
  // Network First: Para API calls y HTML
  NETWORK_FIRST: 'network-first',
  // Stale While Revalidate: Para recursos que pueden servirse stale
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate'
};

/**
 * Instalación del Service Worker
 * Cachea assets estáticos críticos
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cacheando assets estáticos');
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .then(() => {
        console.log('[SW] Assets estáticos cacheados correctamente');
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error durante la instalación:', error);
      })
  );
});

/**
 * Activación del Service Worker
 * Limpia cachés antiguos
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Activando Service Worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Eliminar cachés que no sean los actuales
              return cacheName !== STATIC_CACHE_NAME && 
                     cacheName !== DYNAMIC_CACHE_NAME &&
                     cacheName.startsWith('digital-twin');
            })
            .map((cacheName) => {
              console.log('[SW] Eliminando caché antiguo:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => {
        console.log('[SW] Service Worker activado y listo');
        // Tomar control de todas las pestañas abiertas
        return self.clients.claim();
      })
  );
});

/**
 * Interceptar peticiones (Fetch)
 * Aplica estrategias de caché según el tipo de recurso
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar peticiones no HTTP/HTTPS (ej: chrome-extension://)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Ignorar peticiones a APIs externas (opcional)
  if (url.origin !== location.origin) {
    // Para APIs externas, usar Network Only
    return;
  }

  // Determinar estrategia según el tipo de recurso
  const strategy = getCacheStrategy(request);
  
  event.respondWith(handleRequest(request, strategy));
});

/**
 * Determina la estrategia de caché basada en el tipo de petición
 */
function getCacheStrategy(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // HTML - Network First (para tener siempre la versión más reciente)
  if (request.headers.get('Accept')?.includes('text/html') || 
      pathname === '/' || 
      pathname.endsWith('.html')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // CSS, JS, imágenes, fonts - Cache First (recursos estáticos versionados)
  if (pathname.startsWith('/css/') ||
      pathname.startsWith('/js/') ||
      pathname.startsWith('/assets/') ||
      pathname.endsWith('.css') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.jpg') ||
      pathname.endsWith('.jpeg') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico') ||
      pathname.endsWith('.woff') ||
      pathname.endsWith('.woff2')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // Manifest - Cache First
  if (pathname.endsWith('.webmanifest') || pathname.endsWith('.json')) {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // API calls - Network First (datos frescos)
  if (pathname.startsWith('/api/')) {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Por defecto: Stale While Revalidate
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

/**
 * Maneja la petición según la estrategia seleccionada
 */
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);
    default:
      return networkFirst(request);
  }
}

/**
 * Cache First: Busca en caché primero, si no está va a red y cachea
 * Ideal para: CSS, JS, imágenes, assets versionados
 */
async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    // Servir desde caché
    return cachedResponse;
  }

  // No está en caché, ir a la red
  try {
    const networkResponse = await fetch(request);
    
    // Solo cachear respuestas válidas
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('[SW] Error en red (cache-first):', error);
    // Devolver página offline si es navegación
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    throw error;
  }
}

/**
 * Network First: Intenta la red primero, si falla usa caché
 * Ideal para: HTML, API calls
 */
async function networkFirst(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  
  try {
    const networkResponse = await fetch(request);
    
    // Cachear respuesta exitosa
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Red no disponible, intentando caché...');
    
    // Intentar servir desde caché
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si es navegación y no hay caché, devolver página offline
    if (request.mode === 'navigate') {
      return caches.match('/index.html');
    }
    
    throw error;
  }
}

/**
 * Stale While Revalidate: Sirve desde caché inmediatamente y actualiza en background
 * Ideal para: Recursos que pueden tolerar datos ligeramente antiguos
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch en background para actualizar caché
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch(() => {
      // Silenciar errores de red en background
    });

  // Servir caché inmediatamente si existe, sino esperar red
  return cachedResponse || fetchPromise;
}

/**
 * Manejar mensajes del cliente (página)
 */
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
      
    case 'CLEAR_CACHE':
      clearAllCaches().then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;
  }
});

/**
 * Limpiar todas las cachés
 */
async function clearAllCaches() {
  const cacheNames = await caches.keys();
  await Promise.all(
    cacheNames
      .filter(name => name.startsWith('digital-twin'))
      .map(name => caches.delete(name))
  );
  console.log('[SW] Todas las cachés limpiadas');
}

/**
 * Notificar a clientes sobre actualización de caché
 */
async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage(message);
  });
}

// Sincronización en segundo plano (Background Sync) - para futuras implementaciones
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  console.log('[SW] Background sync ejecutado');
  // Aquí se podría sincronizar datos offline cuando vuelva la conexión
}

// Notificaciones Push - para futuras implementaciones
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  const options = {
    body: data.body || 'Nueva notificación',
    icon: '/assets/icon-192.png',
    badge: '/assets/icon-72.png',
    vibrate: [200, 100, 200],
    data: data.url || '/',
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Cerrar' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Digital Twin', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        for (const client of clientList) {
          if (client.url === event.notification.data && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow(event.notification.data);
      })
    );
  }
});

console.log('[SW] Service Worker cargado - Digital Twin PoC v1.0.0');