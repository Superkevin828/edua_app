// LearnPremium Service Worker
const CACHE_NAME = 'learnpremium-v1';

self.addEventListener('install', event => {
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    // Only cache GET requests for static assets
    if (event.request.method !== 'GET') return;
    const url = new URL(event.request.url);
    // Don't cache API calls
    if (url.hostname.includes('onrender.com')) return;

    event.respondWith(
        caches.match(event.request).then(cached => cached || fetch(event.request))
    );
});