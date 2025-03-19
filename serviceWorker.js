const CACHE_NAME = 'highStakesV5RCCalc';
const urlsToCache = [
  '/vexScoreCalc/',
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
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response;
        return fetch(event.request).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/your-repo/index.html');
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