const CACHE_NAME = 'portfolio-v2';
const IS_LOCALHOST =
  self.location.hostname === 'localhost' || self.location.hostname === '127.0.0.1';

// Install — activate immediately so stale SWs (like portfolio-v1) are replaced
self.addEventListener('install', (event) => {
  if (IS_LOCALHOST) {
    self.skipWaiting();
    return;
  }
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/']))
  );
  self.skipWaiting();
});

// Activate — clean all old caches; on localhost self-destruct to never break Next.js dev HMR
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => IS_LOCALHOST || name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => {
        if (IS_LOCALHOST) {
          return self.registration.unregister();
        }
        return self.clients.claim();
      })
  );
});

// Fetch — network first for HTML navigations ONLY (never cache /_next/ chunks or dev assets)
self.addEventListener('fetch', (event) => {
  if (IS_LOCALHOST) return;
  if (event.request.method !== 'GET') return;
  if (event.request.mode !== 'navigate') return;

  const url = event.request.url;
  if (
    url.includes('/api/') ||
    url.includes('/_next/') ||
    !url.startsWith(self.location.origin)
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
