// রেজা পোর্টাল — Service Worker
// Cache strategy:
//   API calls  → Network only (never cache — live data)
//   App shell  → Cache first, fall back to network
//   Font files → Cache permanently (they never change)

const CACHE_VERSION = 'reza-portal-v1';
const FONT_CACHE    = 'reza-fonts-v1';

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.json',
  '/portal-logo.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

const FONT_FILES = [
  '/NotoSansBengali-Regular.ttf',
  '/NotoSansBengali-Bold.ttf',
];

// ── Install: pre-cache app shell ───────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_VERSION).then(c => c.addAll(APP_SHELL)),
      caches.open(FONT_CACHE).then(c => c.addAll(FONT_FILES)),
    ])
  );
  self.skipWaiting();
});

// ── Activate: delete old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== CACHE_VERSION && k !== FONT_CACHE)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. API calls — always go to network, never cache
  if (url.pathname.startsWith('/api/')) return;

  // 2. Non-GET requests — pass through
  if (request.method !== 'GET') return;

  // 3. Font files — cache permanently
  if (url.pathname.endsWith('.ttf') || url.pathname.endsWith('.woff2')) {
    event.respondWith(
      caches.open(FONT_CACHE).then(cache =>
        cache.match(request).then(cached => {
          if (cached) return cached;
          return fetch(request).then(res => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // 4. JS/CSS assets (hashed filenames) — cache first forever
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(res => {
          if (res.ok) {
            caches.open(CACHE_VERSION).then(c => c.put(request, res.clone()));
          }
          return res;
        });
      })
    );
    return;
  }

  // 5. Everything else (HTML, images, manifest) — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.ok) {
          caches.open(CACHE_VERSION).then(c => c.put(request, res.clone()));
        }
        return res;
      })
      .catch(() => caches.match(request).then(cached => cached || caches.match('/index.html')))
  );
});
