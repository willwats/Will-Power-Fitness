/* Will Power Fitness — offline cache (stale-while-revalidate). Bump CACHE when you change files. */
const CACHE = 'wpf-v4';
const SHELL = [
  './', './index.html', './styles.css', './exercises.js', './anim.js', './anim-upper.js', './anim-lower.js', './anim-core.js', './anim-map.js', './app.js', './cardio.js', './cardio-ui.js', './manifest.webmanifest',
  './icons/favicon-64.png', './icons/logo-mark.png', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then((cached) => {
      const network = fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      }).catch(() => cached || caches.match('./index.html'));
      return cached || network;
    })
  );
});
