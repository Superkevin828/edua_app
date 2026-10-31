// Minimal service worker.
// Its only job is to exist at /sw.js so registration succeeds. It deliberately
// caches nothing, to avoid serving stale HTML/JS after a deploy.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
