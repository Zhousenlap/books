// 离谱历史书架 — 离线缓存（bump CACHE 版本以触发更新）
const CACHE = 'story-shelf-v7';
const CORE = [
  './', './index.html', './books.js', './manifest.webmanifest',
  './assets/icon-192.png', './assets/icon-512.png', './assets/apple-touch-icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).catch(() => {}));
  self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) =>
    Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
// books.js 走网络优先（拿新故事），其余缓存优先。
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (u.pathname.endsWith('books.js')) {
    e.respondWith(
      fetch(e.request).then((r) => {
        const copy = r.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy));
        return r;
      }).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(caches.match(e.request).then((hit) => hit || fetch(e.request).then((r) => {
      if (e.request.method === 'GET' && r.status === 200 && u.origin === location.origin) {
        const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy));
      }
      return r;
    }).catch(() => hit)));
  }
});
