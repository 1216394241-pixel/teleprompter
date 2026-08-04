const CACHE='follow-prompter-v4';
const ASSETS=['./','./index.html','./styles.css','./app.js','./transcription-worker.js','./manifest.webmanifest'];
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('fetch', event => event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request))));
