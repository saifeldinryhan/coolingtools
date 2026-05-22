

// === ثوابت التخزين المؤقت (من service-worker.js) ===
const CACHE_VERSION = "cooling-tools-v1.22";
const CORE_FILES = [
  "/",
  "/index.html",
  "/manifest.json",
  "/favicon.png",
  "/js/basic.js",
  "/css/basic.css",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/fonts/Cairo-VariableFont_slnt,wght.ttf",
  "/css/all.min.css",
  "/css/tailwind.css",
  "/webfonts/fa-brands-400.woff2",
  "/webfonts/fa-regular-400.woff2",
  "/webfonts/fa-solid-900.woff2",
  "/webfonts/fa-v4compatibility.woff2"
];

// === مستمع التثبيت (caching) ===
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      console.log("Caching core files...");
      return cache.addAll(CORE_FILES);
    })
  );
  self.skipWaiting();
});

// === مستمع التنشيط (حذف المخازن القديمة) ===
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_VERSION) {
            console.log("Deleting old cache:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// === مستمع الطلبات (يعالج فقط ملفات PWA الأساسية، ويترك الباقي للسكريبت الخارجي) ===
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  // نتدخل فقط إذا كان الطلب لنفس النطاق ومساره ضمن CORE_FILES
  if (url.origin === self.location.origin && CORE_FILES.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(networkResponse => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_VERSION).then(cache => {
            cache.put(event.request, responseClone);
          });
          return networkResponse;
        }).catch(() => {
          return caches.match("/index.html");
        });
      })
    );
  }
  // للطلبات الأخرى: لا نستدعي respondWith، مما يسمح للسكريبت الخارجي بالتعامل معها
});
