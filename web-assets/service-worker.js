const CACHE = 'lock-vocab-v1';
const URLS_TO_CACHE = [
  './',
  'index.html',
  'favicon.ico',
  './_expo/static/js/web/index-e639408d41f3b26bbb4e68de82ca579c.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(URLS_TO_CACHE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        return caches.open(CACHE).then((cache) => {
          try { cache.put(event.request, response.clone()); } catch (e) { }
          return response;
        });
      }).catch(() => caches.match('index.html'));
    })
  );
});
