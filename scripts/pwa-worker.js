/* The build replaces these placeholders with a content hash and exported files. */
const CACHE_NAME = __CACHE_NAME__;
const APP_FILES = __APP_FILES__;
const FILE_PATHS = new Set(APP_FILES);

self.addEventListener('install', (event) => {
  // Atomic installation: a failed download keeps the previous version active.
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
  // Let the new version wait until all windows using the old version close.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((names) => Promise.all(
    names.filter((name) => name.startsWith('navmarina-pwa-') && name !== CACHE_NAME)
      .map((name) => caches.delete(name)),
  )).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Never cache telemetry, API calls, maps, WebSockets or third-party responses.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  let path = url.pathname;
  if (request.mode === 'navigate') {
    if (path.endsWith('/')) path += 'index.html';
    else if (!path.endsWith('.html')) path += '.html';
    // Expo's single-page export renders its routes in the browser.
    if (!FILE_PATHS.has(path)) path = '/index.html';
  }
  if (!FILE_PATHS.has(path)) return;
  event.respondWith(caches.open(CACHE_NAME).then(async (cache) =>
    (await cache.match(path)) || fetch(request)));
});
