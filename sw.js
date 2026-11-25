/* Will Power Fitness — offline cache (stale-while-revalidate). Bump CACHE when you change files. */
const CACHE = 'wpf-v49';
const SHELL = [
  './', './index.html', './styles.css', './exercises.js', './exercises-more.js', './anim.js', './anim-upper.js', './anim-lower.js', './anim-core.js', './anim-extra.js', './anim-map.js', './app.js', './cardio.js', './cardio-ui.js', './body.js', './body-ui.js', './progress.js', './guide.js', './custom.js', './recovery.js', './anatomy.js', './motivate.js', './sport.js', './plan.js', './track.js', './plan-ui.js', './track-ui.js', './manifest.webmanifest',
  './icons/favicon-64.png', './icons/logo-mark.png', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png',
];

// Network first: when online you always get the newest version; the cache is only for offline use.
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE)
    .then((c) => c.addAll(SHELL.map((u) => new Request(u, { cache: 'reload' }))))   // skip the browser's HTTP cache so a new version never caches old files
    .then(() => self.skipWaiting()));
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
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await Promise.race([
        fetch(req, { cache: 'no-cache' }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000)),
      ]);
      if (res && res.ok) cache.put(req, res.clone());
      return res;
    } catch (err) {
      return (await cache.match(req, { ignoreSearch: true })) || (await cache.match('./index.html')) || Response.error();
    }
  })());
});
