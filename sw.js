// Bump this on every deploy. It is the only thing that makes installed copies pick up a new shell.
// v23: fill the real screen on iOS home-screen (works around the short-viewport bug).
const CACHE = 'fwea-hub-v23';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
];

// Third-party assets that never change under the same URL, so cache-then-network is safe.
const STATIC_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Weather and geocoding must always be live. The app keeps its own last-known copy.
  if (url.hostname.endsWith('open-meteo.com')) return;

  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req, { ignoreSearch: req.mode === 'navigate' })
        .then(hit => hit || fetch(req).catch(() => caches.match('./index.html')))
    );
    return;
  }

  if (STATIC_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CACHE).then(async cache => {
        const hit = await cache.match(req);
        const fresh = fetch(req).then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; }).catch(() => hit);
        return hit || fresh;
      })
    );
  }
});
