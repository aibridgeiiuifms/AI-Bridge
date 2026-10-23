// AI Bridge – Service Worker
// Strategy: Network-first for pages, Cache-first for static assets, Background Sync for offline submissions

const CACHE_NAME = 'ai-bridge-v3';
const STATIC_ASSETS = [
  '/',
  '/team',
  '/events',
  '/portal',
  '/login',
  '/offline.html',
  '/manifest.json',
  '/logo.webp',
  '/logo.jpg',
  '/iiui-logo.webp',
  '/hhp-logo.webp',
];

// ── Install: pre-cache shell assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for HTML/API, cache-first for static assets ─────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and Supabase/API requests
  if (
    request.method !== 'GET' ||
    url.origin !== location.origin ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/')
  ) {
    return;
  }

  // Static assets (images, fonts, _next/static) → cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/highlights/') ||
    url.pathname.startsWith('/sdg-slices/') ||
    /\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|otf|css|js)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // HTML pages → network-first, fall back to cache or offline.html
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        // If navigation or HTML request fails and nothing in cache, show offline fallback
        if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/offline.html');
        }
      })
  );
});

// ── Background Sync for Form Submissions ─────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'portal-submit') {
    event.waitUntil(processQueuedPortalSubmissions());
  }
});

async function processQueuedPortalSubmissions() {
  // Notify open clients that background sync is processing
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_PORTAL_SUBMISSIONS' });
  });
}
