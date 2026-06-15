// ── SERVICE WORKER — Cache-first strategy for full offline support ─────────────
const CACHE = 'faluche-v34';

// Fichiers essentiels au fonctionnement hors ligne (tous présents à la racine)
const FILES = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './db.js',
  './sync.js',
  './config.js',
  './questions.js',
  './songs.js',
  './badges.js',
  './manifest.json',
  './icon-192.svg',
  './icon-512.svg',
];

// Installation : on met en cache chaque fichier INDIVIDUELLEMENT.
// Ainsi, si un fichier est introuvable (404), cela ne fait PAS échouer
// toute l'installation du cache (c'était le bug qui cassait le mode hors ligne).
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(async cache => {
      await Promise.all(FILES.map(async url => {
        try {
          await cache.add(new Request(url, { cache: 'reload' }));
        } catch (err) {
          // On ignore les fichiers qui échouent, le reste du cache reste valide
          console.warn('[SW] Impossible de mettre en cache :', url, err);
        }
      }));
      await self.skipWaiting();
    })
  );
});

// Activation : on supprime les anciens caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Stratégie de récupération :
//  - cache d'abord (offline-first)
//  - sinon réseau, et on met en cache au passage les GET réussis
//  - en dernier recours pour une navigation, on renvoie index.html
self.addEventListener('fetch', e => {
  const req = e.request;
  // On ne gère que le GET (POST vers Supabase etc. passent directement au réseau)
  if (req.method !== 'GET') return;

  e.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        // Mettre en cache les réponses valides same-origin
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(req, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => {
        // Hors ligne et pas en cache : pour une navigation, fallback sur l'app
        if (req.mode === 'navigate') return caches.match('./index.html');
        return caches.match('./') ;
      });
    })
  );
});
