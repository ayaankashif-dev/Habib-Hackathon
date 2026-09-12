// ScamWatch Unified PWA Service Worker & Push Notification Handler
const CACHE_VERSION = "scamwatch-v1.0.0";
const PRECACHE_CACHE = `precache-${CACHE_VERSION}`;
const RUNTIME_CACHE = `runtime-${CACHE_VERSION}`;

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
  "/icons/icon-maskable-192x192.png",
  "/icons/icon-maskable-512x512.png",
  "/icons/apple-touch-icon.png",
  "/icons/icon.svg",
  "/favicon.ico"
];

// ----------------------------------------------------
// 1. Service Worker Lifecycle (Install & Activate)
// ----------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PRECACHE_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.warn("[SW] Pre-caching error:", err);
      })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== PRECACHE_CACHE && name !== RUNTIME_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// ----------------------------------------------------
// 2. Network & Caching Strategies
// ----------------------------------------------------
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET requests or browser extension protocols
  if (request.method !== "GET" || !url.protocol.startsWith("http")) {
    return;
  }

  // Never cache API routes, Server-Sent Events, or external APIs
  if (
    url.pathname.startsWith("/api/") ||
    url.origin.includes("supabase.co") ||
    url.origin.includes("googleapis.com") ||
    url.origin.includes("groq.com")
  ) {
    return;
  }

  // 1. Navigation requests: Network-first with offline fallback
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful page navigations in runtime cache
          if (response && response.status === 200) {
            const responseClone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return response;
        })
        .catch(async () => {
          // Check runtime cache first
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fall back to offline page
          const offlinePage = await caches.match("/offline");
          if (offlinePage) {
            return offlinePage;
          }
          return new Response("Offline - ScamWatch protection is standing by.", {
            status: 503,
            headers: { "Content-Type": "text/plain" },
          });
        })
    );
    return;
  }

  // 2. Static Next.js assets, fonts, icons: Cache-first with background revalidation
  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|ico|woff|woff2|ttf|css|js)$/)
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Return cached version immediately and update cache in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {
              // Ignore network failures for background revalidation
            });
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. All other requests: Network-first
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

// ----------------------------------------------------
// 3. Firebase Cloud Messaging (FCM) Push Notifications
// ----------------------------------------------------
try {
  importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js");
  importScripts("https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js");

  const firebaseConfig = {
    apiKey: "AIzaSyDtko_Q85ICFh7G5RyPzjVm5BbNaNjjobE",
    authDomain: "scam-watch-608d9.firebaseapp.com",
    projectId: "scam-watch-608d9",
    storageBucket: "scam-watch-608d9.firebasestorage.app",
    messagingSenderId: "249699730207",
    appId: "1:249699730207:web:a81045d5a6a36bcb6f662a",
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }

  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log("[sw.js] Received background FCM message: ", payload);
    const notificationTitle = payload.notification?.title || "ScamWatch Alert";
    const notificationOptions = {
      body: payload.notification?.body || "A security event requires your attention.",
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [200, 100, 200, 100, 200],
      data: payload.data,
      requireInteraction: true,
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (fcmErr) {
  console.warn("[sw.js] FCM scripts could not be loaded or initialized:", fcmErr);
}

// Handle notification tap
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
