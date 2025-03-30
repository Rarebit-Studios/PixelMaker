const CACHE_VERSION = '1.1.0'; // Match this with APP_VERSION
const CACHE_NAME = `pixel-maker-${CACHE_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './bg1.png',
  './icon-192.png',
  './icon-512.png',
  './Icon_Pen.Png',
  './Icon_erase.Png',
  './Icon_Fill.Png',
  './Icon_Pick.Png',
  './Icon_Arrow_2_Left.Png',
  './Icon_Arrow_2_Right.Png',
  './Icon_Paste.Png',
  './Icon_Folder_Save.Png',
  './Icon_Folder_Open.Png',
  './Icon_clear.Png',
  './makecode.png',
  './logo.png',
  './rotate-device.png',
  './manifest.json'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(keyList.map((key) => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response; // Return cached version
        }
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response as it can only be consumed once
            const responseToCache = response.clone();

            // Add the new resource to cache
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          });
      })
  );
}); 