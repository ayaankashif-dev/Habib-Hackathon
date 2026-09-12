// Firebase Cloud Messaging Service Worker for ScamWatch
// Handles background notifications when web app is closed or in background on Mobile / Desktop

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
  console.log("[firebase-messaging-sw.js] Received background message: ", payload);
  const title = payload.notification?.title || payload.data?.title || "🚨 ScamWatch Security Alert";
  const body = payload.notification?.body || payload.data?.body || payload.data?.message || "New security alert received.";
  
  const options = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200, 100, 200],
    data: payload.data || { url: "/" },
    requireInteraction: true,
  };

  self.registration.showNotification(title, options);
});

// Fallback native push listener for mobile browsers (Chrome Android, Samsung Internet)
self.addEventListener("push", (event) => {
  let title = "🚨 ScamWatch Security Alert";
  let body = "New security alert received.";
  let data = { url: "/" };

  if (event.data) {
    try {
      const payload = event.data.json();
      title = payload.notification?.title || payload.data?.title || title;
      body = payload.notification?.body || payload.data?.body || payload.data?.message || body;
      data = payload.data || data;
    } catch {
      body = event.data.text() || body;
    }
  }

  const options = {
    body,
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    vibrate: [200, 100, 200, 100, 200],
    data,
    requireInteraction: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handler
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
