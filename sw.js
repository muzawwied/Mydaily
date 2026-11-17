/* Service worker My Daily: seluruh aplikasi (HTML, ikon, dan gambar) tetap hidup tanpa internet. */
const VERSION = 'mydaily-v114';
const CACHE = VERSION;
const EXT_CACHE = 'mydaily-ext-v114';
const SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/js/ai-brain.js',
  '/js/ai-tools.js',
  '/berkas/',
  '/berkas/reader.js',
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
]
// Font web (Google Fonts) ikut di-precache supaya tampilan offline tidak memakai font cadangan.
const FONT_CSS = "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700;800&family=Dancing+Script:wght@700&family=Fredoka:wght@600&family=Bricolage+Grotesque:wght@800&display=swap";
const FONTS = [
  "https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvZvl-MQlss4KHt0uOQ.woff2",
  "https://fonts.gstatic.com/s/bricolagegrotesque/v9/3y9U6as8bTXq_nANBjzKo3IeZx8z6up5BeSl5jBNz_19PpbpMXuECpwUxJBOm_OJWiaaD30YfKfjZZoLvZvl-Molss4KHt0.woff2",
  "https://fonts.gstatic.com/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7B1i03ROp8hNP6pnxP.woff2",
  "https://fonts.gstatic.com/s/dancingscript/v29/If2cXTr6YS-zF4S-kcSWSVi_sxjsohD9F50Ruu7B1i03Sup8hNP6pg.woff2",
  "https://fonts.gstatic.com/s/fredoka/v17/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3OLyX8H-mKttpNbgEt.woff2",
  "https://fonts.gstatic.com/s/fredoka/v17/X7nP4b87HvSqjb_WIi2yDCRwoQ_k7367_B-i2yQag0-mac3OLyX8EemKttpNbg.woff2",
  "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko40yygg_vbd-E.woff2",
  "https://fonts.gstatic.com/s/plusjakartasans/v12/LDIoaomQNQcsA88c7O9yZ4KMCoOg4Ko20yygg_vb.woff2"
];
;
const NET_TIMEOUT = 3000;

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    await Promise.allSettled(SHELL.map((u) => c.add(new Request(u, { cache: 'reload' }))));
    // Font dari origin lain disimpan terpisah; gagal satu font tidak membatalkan install.
    const fc = await caches.open(EXT_CACHE);
    await Promise.allSettled([FONT_CSS, ...FONTS].map((u) =>
      fc.add(new Request(u, { mode: 'cors', cache: 'reload' }))
    ));
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

  // Versi aplikasi harus selalu data terbaru, bukan salinan cache.
  if (url.pathname === '/version.json') {
    e.respondWith(fetch(req, { cache: 'no-store' }).catch(() => caches.match(req)));
    return;
  }

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
