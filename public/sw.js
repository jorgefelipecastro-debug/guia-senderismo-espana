// Only anonymous, explicitly public application resources belong in CacheStorage.
const CACHE_NAME = 'encumbrate-public-v15';
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon-192-v2.jpg', '/icon-512-v2.jpg', '/apple-touch-icon-v2.jpg', '/offline.html', '/offline/viewer.mjs', '/offline/maps.mjs'];
const MAX_ASSETS = 160;
const ownedCache = name => /^encumbrate-(?:v\d+|public-v\d+)$/.test(name) || name === 'cumbre-v1';
const canStore = response => response.status === 200 && !response.redirected &&
  !['opaque', 'opaqueredirect'].includes(response.type) &&
  !/no-store|private|no-cache/i.test(response.headers.get('cache-control') || '') &&
  !response.headers.has('set-cookie') &&
  !/(?:^|,)\s*(?:\*|cookie|authorization)\s*(?:,|$)/i.test(response.headers.get('vary') || '');
const publicAsset = url => url.origin === self.location.origin && !url.search && (
  APP_SHELL.slice(1).includes(url.pathname) ||
  /^\/_next\/static\/[a-zA-Z0-9_./-]+\.(?:js|css|woff2?)$/.test(url.pathname) ||
  /^\/badges\/[a-zA-Z0-9_-]+\.(?:webp|png|jpg|svg)$/.test(url.pathname)
);

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Never copy HTML from a signed-in navigation or carry cookies into the shell.
    await Promise.all(APP_SHELL.map(async path => {
      try {
        const response = await fetch(new URL(path, self.location.origin), {
          credentials: 'omit', cache: 'no-store', redirect: 'error',
        });
        if (canStore(response) && (path !== '/' || /(?:^|,)\s*public(?:,|$)/i.test(response.headers.get('cache-control') || '')))
          await cache.put(path, response);
        else if (path.startsWith('/offline')) throw Error('Offline resources unavailable');
      } catch (error) {
        // Keep the previous protected worker if the new offline screen is incomplete.
        if (path.startsWith('/offline')) throw error;
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    // Purge legacy broad caches, without deleting another app's caches or GPS databases.
    await Promise.all((await caches.keys()).filter(name => ownedCache(name) && name !== CACHE_NAME).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

let writes = Promise.resolve();
function saveAsset(request, response) {
  writes = writes.catch(() => {}).then(async () => {
    const cache = await caches.open(CACHE_NAME);
    if (!canStore(response)) { await cache.delete(request); return; }
    await cache.put(request, response);
    const keys = (await cache.keys()).filter(key => !APP_SHELL.includes(new URL(key.url).pathname));
    for (const key of keys.slice(0, Math.max(0, keys.length - MAX_ASSETS))) await cache.delete(key);
  });
  return writes.catch(() => {});
}

function navigationFetch(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 6000);
  return fetch(request, {cache: 'no-store', signal: controller.signal}).finally(() => clearTimeout(timer));
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  const viewerNavigation = request.mode === 'navigate' && url.origin === self.location.origin && url.pathname === '/offline.html';
  if (viewerNavigation) {
    event.respondWith(navigationFetch(request).catch(async () => (await (await caches.open(CACHE_NAME)).match('/offline.html')) || Response.error()));
    return;
  }
  const allowed = !request.headers.has('authorization') && !request.headers.has('range') && publicAsset(url);
  if (allowed) {
    // Fetch only public assets without cookies; never persist the caller's headers.
    const anonymous = new Request(url.href, {credentials: 'omit', cache: 'no-store', redirect: 'error'});
    const result = fetch(anonymous);
    event.waitUntil(result.then(response => saveAsset(anonymous, response.clone())).catch(() => {}));
    event.respondWith(result.catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match(anonymous)) || Response.error();
    }));
    return;
  }
  // APIs, Supabase, signed media, RSC and account pages never read or write caches.
  const response = request.mode === 'navigate' ? navigationFetch(request) : fetch(request, {cache: 'no-store'});
  event.respondWith(response.catch(async () => {
    if (request.mode === 'navigate' && url.origin === self.location.origin && url.pathname === '/' && !url.search && !request.headers.has('authorization')) {
      const cache = await caches.open(CACHE_NAME);
      return (await cache.match('/offline.html')) || Response.error();
    }
    return Response.error();
  }));
});
