// sw.js — Cache-first strategy for app shell, network-first for API
const CACHE_VERSION = 'nexus-fit-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/variables.css',
  './css/base.css',
  './css/components.css',
  './css/layout.css',
  './css/animations.css',
  './js/app.js',
  './js/store.js',
  './js/storage.js',
  './js/ai.js',
  './js/ui.js',
  './js/charts.js',
  './js/pages/home.js',
  './js/pages/nutrition.js',
  './js/pages/coach.js',
  './js/pages/workout.js',
  './js/pages/progress.js',
  './js/pages/settings.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);

  // Never cache external APIs — let them hit network (and fail gracefully offline)
  if (url.origin !== self.location.origin) {
    return;
  }

  e.respondWith(
    caches.match(req).then((cached) => {
      const fetchPromise = fetch(req).then((response) => {
        // Update cache with fresh copy if valid
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, clone));
        }
        return response;
      }).catch(() => cached); // offline fallback to cache
      return cached || fetchPromise;
    })
  );
});
