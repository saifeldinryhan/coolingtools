// Monetag Ads
self.options = {
  "domain": "3nbf4.com",
  "zoneId": 10879922
};

self.lary = "";

try {
  importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw');
} catch (e) {
  console.log("Monetag SW not loaded");
}


// ===== Cache الخاص بالتطبيق =====

const CACHE_VERSION = "cooling-tools-v3";

const STATIC_CACHE = [
  "/",
  "/index.html",
  "/manifest.json",

  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/favicon.png"
];


// تثبيت Service Worker
self.addEventListener("install", event => {

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => cache.addAll(STATIC_CACHE))
  );

  self.skipWaiting();

});


// تشغيل Service Worker
self.addEventListener("activate", event => {

  event.waitUntil(
    caches.keys().then(keys => {

      return Promise.all(
        keys.map(key => {

          if (key !== CACHE_VERSION) {
            return caches.delete(key);
          }

        })
      );

    })
  );

  self.clients.claim();

});


// جلب الملفات
self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request).then(response => {

      if (response) return response;

      return fetch(event.request)
        .then(networkResponse => {

          const copy = networkResponse.clone();

          caches.open(CACHE_VERSION)
            .then(cache => cache.put(event.request, copy));

          return networkResponse;

        })
        .catch(() => caches.match("/index.html"));

    })

  );

});