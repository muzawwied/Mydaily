/* Service worker My Daily: seluruh aplikasi (HTML, ikon, dan gambar) tetap hidup tanpa internet. */
const VERSION = 'mydaily-v10';
const CACHE = VERSION;
const EXT_CACHE = 'mydaily-ext-v10';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/js/ai-brain.js',
  '/js/ai-tools.js',
  '/favicon.ico',
  '/assets/img/favicon-32.png',
  '/assets/img/apple-touch-icon.png',
  '/assets/img/icon-192.png',
  '/assets/img/icon-512.png',
  '/assets/img/shortcut-kalender.png',
  '/assets/img/shortcut-tugas.png',
  '/assets/img/shortcut-catatan.png',
  '/assets/img/shortcut-chat.png',
  '/assets/img/daily-01.jpg',
  '/assets/img/daily-02.jpg',
  '/assets/img/daily-03.jpg',
  '/assets/img/daily-04.jpg',
  '/assets/img/daily-05.jpg',
  '/assets/img/daily-06.jpg',
  '/assets/img/daily-07.jpg',
  '/assets/img/daily-08.jpg',
  '/assets/img/daily-09.jpg',
  '/assets/img/daily-10.jpg',
  '/assets/img/daily-11.jpg',
  '/assets/img/daily-12.jpg'
];
const NET_TIMEOUT = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE && k !== EXT_CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function timeout(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms, null));
}

async function shell() {
  const c = await caches.open(CACHE);
  return (await c.match('/')) || (await c.match('/index.html'));
}

async function networkFirst(req) {
  const c = await caches.open(CACHE);
  const net = fetch(req).then((res) => {
    if (res && res.ok) {
      const copy = res.clone();
      c.put(req, copy).catch(() => {});
      // Simpan juga sebagai shell supaya rute lain bisa dibuka saat offline.
      c.put('/', res.clone()).catch(() => {});
    }
    return res;
  });
  const first = await Promise.race([net.catch(() => null), timeout(NET_TIMEOUT)]);
  if (first) return first;
  const hit = (await c.match(req)) || (await shell());
  if (hit) return hit;
  return net;
}

async function cacheFirst(req, cacheName) {
  const c = await caches.open(cacheName);
  const hit = await c.match(req);
  if (hit) {
    fetch(req).then((res) => { if (res && res.ok) c.put(req, res.clone()).catch(() => {}); }).catch(() => {});
    return hit;
  }
  const res = await fetch(req);
  if (res && (res.ok || res.type === 'opaque')) c.put(req, res.clone()).catch(() => {});
  return res;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.pathname.indexOf('/api/') === 0) return;
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  const isDoc = req.mode === 'navigate' || (req.headers.get('accept') || '').indexOf('text/html') !== -1;
  if (isDoc) {
    e.respondWith(networkFirst(req));
    return;
  }

  if (url.origin === location.origin) {
    e.respondWith(cacheFirst(req, CACHE));
    return;
  }

  e.respondWith(cacheFirst(req, EXT_CACHE));
});
