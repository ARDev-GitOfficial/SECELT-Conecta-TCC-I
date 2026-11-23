const CACHE = 'secelt-municipal-v6';
const APP_SHELL = [
  '/',
  '/manifest.webmanifest',
  '/assets/brand.svg',
  '/assets/prefeitura-guama.png',
  '/assets/orla-portal.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('secelt-') && key !== CACHE).map(key => caches.delete(key))
  )));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const { origin, pathname } = new URL(request.url);
  if (request.method !== 'GET' || origin !== self.location.origin || pathname.startsWith('/api/') || pathname.startsWith('/downloads/')) return;

  event.respondWith(fetch(request).then(async response => {
    if (response.ok) {
      const copy = response.clone();
      await caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
    }
    return response;
  }, async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') return await cache.match('/') ?? Response.error();
    return Response.error();
  }));
});
