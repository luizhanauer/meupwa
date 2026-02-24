const CACHE_NAME = 'meupwa-v1';

// Recursos vitais para o PWA funcionar offline (Incluindo Ícones e Screenshots)
const ASSETS_TO_CACHE = [
  "./",
  "/index.html",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/screenshots/screenshot-desktop.png",
  "/screenshots/screenshot-mobile.png"
];

// 1. Instalação: Adiciona os recursos essenciais à cache
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  // Força a ativação imediata do novo service worker
  self.skipWaiting();
});

// 2. Ativação: Limpa caches antigas se a versão (CACHE_NAME) mudar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME && name.startsWith('meupwa')) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Garante que o SW assume o controlo das páginas abertas imediatamente
  self.clients.claim();
});

// 3. Interceção (Fetch): Estratégia Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  // Ignora pedidos que não sejam GET (ex: POST para APIs)
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Faz o pedido à rede em segundo plano para atualizar a cache
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse.ok) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      }).catch(() => {
        console.warn('Recurso offline não disponível:', event.request.url);
      });

      return cachedResponse || fetchPromise;
    })
  );
});