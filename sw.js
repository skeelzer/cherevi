// ── SERVICE WORKER — Cache-first strategy for full offline support ─────────────
const CACHE = 'faluche-v14';
const FILES = [
  './',
  './index.html',
  './style.css',
  './questions.js',
  './songs.js',
  './badges.js',
  './config.js',
  './badges/chouette_bicephale.jpg',
  './badges/cor_de_chasse.jpg',
  './badges/globe.jpg',
  './badges/parapluie_perso.jpg',
  './badges/sou_troue.jpg',
  './badges/spheroide.jpg',
  './badges/tortue.jpg',
  './badges/volant.jpg',
  './badges/abeille.jpg',
  './badges/bacchus_perso.jpg',
  './sync.js',
  './db.js',
  './app.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() =>
      caches.match('./index.html')
    ))
  );
});
