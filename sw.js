const CACHE = 'daymean-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './apple-touch-icon.png',
  './favicon-32.png',
  './favicon-192.png',
  './og-image.png',
  './assets/logo-cut.png',
  './assets/demi.jpeg',
  './assets/eirua.jpeg',
  './assets/repit.jpeg',
  './assets/shiseido.jpeg',
  './assets/milbon-hard.jpeg',
  './assets/anaze-hard.webp',
  './assets/milbon-soft.jpeg',
  './assets/anaze-soft.jpeg'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(()=>{})));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  if (e.request.method !== 'GET') return;

  // network-first for HTML — always fetch fresh UI when online
  const isHtml = url.pathname.endsWith('/') || url.pathname.endsWith('/index.html');
  if (isHtml) {
    e.respondWith(
      fetch(e.request).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return res;
      }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // cache-first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      }).catch(() => cached);
    })
  );
});
