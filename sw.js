const CACHE = 'qg-v5';
const ASSETS = [
  './', 'index.html', 'radar.html', 'sala.html', 'cassaforte.html', 'terminale.html', 'bacheca.html', 'sync.html',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'
];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (url.origin === location.origin) {
    if (isHTML) {
      // pagine: prima la rete (versione piu' recente), poi la cache se offline
      e.respondWith(
        fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }).catch(() => caches.match(req).then((r) => r || caches.match('index.html')))
      );
    } else {
      // file statici: prima la cache, veloce
      e.respondWith(
        caches.match(req).then((r) => r || fetch(req).then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
          return res;
        }))
      );
    }
  } else {
    e.respondWith(fetch(req).catch(() => caches.match(req)));
  }
});
