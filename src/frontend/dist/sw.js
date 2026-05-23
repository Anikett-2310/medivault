// ─── Cache Version Strategy ──────────────────────────────────────────────────
// CACHE_VERSION must be incremented on every production deploy to bust stale
// caches across all clients. On activation, the service worker deletes every
// cache whose name is not listed in VALID_CACHES, so old v1/v2/… caches are
// automatically purged when the new SW takes control.
//
// How to bump: change 'v3' → 'v4' (or use a build-time constant injected by
// Vite via import.meta.env.VITE_SW_VERSION). The three derived cache names
// (CACHE_NAME, STATIC_CACHE, API_CACHE) all include CACHE_VERSION so a single
// increment invalidates all three caches simultaneously.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `medivault-${CACHE_VERSION}`;
const STATIC_CACHE = `medivault-static-${CACHE_VERSION}`;
const API_CACHE = `medivault-api-${CACHE_VERSION}`;

const VALID_CACHES = [CACHE_NAME, STATIC_CACHE, API_CACHE];

// Stale-while-revalidate config for ICP API calls
const SWR_MAX_AGE_MS = 5 * 60 * 1000;      // 5 min stale threshold
const SWR_HARD_MAX_AGE_MS = 60 * 60 * 1000; // 1 hr absolute max-age

const APP_SHELL = ['/', '/index.html', '/manifest.json'];

// ─── Install ─────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(APP_SHELL);
    })
  );
});

// ─── Activate ────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => !VALID_CACHES.includes(key))
            .map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
      .then(async () => {
        // Broadcast SW_UPDATED to all open clients after cache purge
        const allClients = await self.clients.matchAll({ includeUncontrolled: true });
        for (const client of allClients) {
          client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
        }
      })
  );
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function isApiRequest(url) {
  return url.includes('raw.icp0.io') || url.includes('icp0.io');
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.origin === self.location.origin &&
    /\.(js|css|woff2?|ttf|eot|svg|png|jpg|jpeg|webp|ico)$/.test(url.pathname)
  );
}

function isNavigation(request) {
  return request.mode === 'navigate';
}

async function networkFirstWithFallback(request, cacheName, fallbackUrl) {
  try {
    const response = await fetch(request);
    if (response.ok && cacheName) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { cacheName });
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl, { cacheName: STATIC_CACHE });
      if (fallback) return fallback;
    }
    return new Response('Network unavailable', { status: 503 });
  }
}

async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request, { cacheName: STATIC_CACHE });
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Network unavailable', { status: 503 });
  }
}

// ─── Fetch ────────────────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET' || url.startsWith('chrome-extension://')) {
    return;
  }

  if (isNavigation(request)) {
    // Network-first for HTML navigation, fallback to app shell
    event.respondWith(networkFirstWithFallback(request, STATIC_CACHE, '/index.html'));
    return;
  }

  if (isApiRequest(url)) {
    // Stale-while-revalidate for ICP API calls (5min stale, 1hr max-age)
    event.respondWith(
      (async () => {
        const cache = await caches.open(API_CACHE);
        const cached = await cache.match(request);
        const now = Date.now();

        if (cached) {
          const cachedDate = new Date(cached.headers.get('date') || 0).getTime();
          const age = now - cachedDate;

          if (age < SWR_HARD_MAX_AGE_MS) {
            // Serve cached; revalidate in background if stale
            if (age > SWR_MAX_AGE_MS) {
              fetch(request)
                .then((fresh) => { if (fresh.ok) cache.put(request, fresh); })
                .catch(() => {});
            }
            return cached;
          }
        }

        // Cache miss or expired — network with cache store
        try {
          const response = await fetch(request);
          if (response.ok) cache.put(request, response.clone());
          return response;
        } catch {
          return (
            cached ||
            new Response(JSON.stringify({ error: 'Offline' }), {
              status: 503,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
      })()
    );
    return;
  }

  if (isStaticAsset(request)) {
    // Cache-first for static JS/CSS/fonts/images
    event.respondWith(cacheFirstWithNetworkFallback(request));
    return;
  }

  // External resources: network only
  event.respondWith(fetch(request));
});

// ─── Background Sync ─────────────────────────────────────────────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-queue') {
    // Stub: clients handle the actual queue flush via postMessage
    event.waitUntil(
      self.clients.matchAll({ includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER', tag: event.tag });
        }
      })
    );
  }
});

// ─── Message Handler ─────────────────────────────────────────────────────────
self.addEventListener('message', (event) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_VERSION':
      event.source.postMessage({ type: 'VERSION', version: CACHE_NAME });
      break;

    case 'CLEAR_CACHE':
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => {
          event.source.postMessage({ type: 'CACHE_CLEARED' });
        });
      break;

    default:
      break;
  }
});
