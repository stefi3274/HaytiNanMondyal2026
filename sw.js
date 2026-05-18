// Service Worker optimisé — Cache-first strategy
const CACHE_NAME = 'ayiti-mondyal-v3';
const CACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

// Installation — cache les assets principaux
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activation — supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — Cache-first pour assets locaux, Network-first pour API
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API Football — toujours réseau (jamais cache)
  if (url.hostname.includes('rapidapi') || 
      url.hostname.includes('firebase') ||
      url.hostname.includes('googleapis')) {
    return; // Laisse passer sans cache
  }

  // Ressources locales — Cache-first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      
      return fetch(e.request).then(response => {
        // Met en cache les nouvelles ressources locales
        if (response.ok && url.hostname === self.location.hostname) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => cached || new Response('Hors ligne', { status: 503 }));
    })
  );
});

// Message pour forcer la mise à jour
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
