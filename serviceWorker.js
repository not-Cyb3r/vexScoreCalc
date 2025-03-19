const CACHE_NAME = 'highStakesV5RCCalc';
const urlsToCache = [
  '/vexScoreCalc/',              // Replace with your repo name
  '/vexScoreCalc/index.html',
  '/vexScoreCalc/styles.css',
  '/vexScoreCalc/script.js',
  '/vexScoreCalc/manifest.json',
  '/vexScoreCalc/icons/icon-192x192.png',
  '/vexScoreCalc/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching:', urlsToCache);
        return cache.addAll(urlsToCache);
      })
      .catch(error => console.error('Install failed:', error))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            console.log('Offline fallback to index.html');
            return caches.match('/vexScoreCalc/index.html');
          }
        });
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});