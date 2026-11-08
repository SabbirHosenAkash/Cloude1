// Service worker: network-first for pages (fresh content), cache-first for same-origin static files.
const CACHE = 'writarion-v4';
const PRECACHE = ['./', './index.html', './style.css', './script.js', './data.js', './config.js', './favicon-32x32.png', './sabbir.webp'];
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((a) => c.add(a).catch(() => {}))))); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== CACHE).map((x) => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.endsWith('/admin.html') || url.pathname.endsWith('/admin.js')) return;
  const fresh = req.mode === 'navigate' || /\.(js|css)$/.test(url.pathname);
  if (fresh) { e.respondWith(fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; }).catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))); return; }
  e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then((x) => x.put(req, c)); } return r; })));
});
