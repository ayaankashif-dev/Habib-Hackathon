"use client";

import { getMessaging, getToken, onMessage, isSupported, type MessagePayload } from "firebase/messaging";
import { doc, setDoc } from "firebase/firestore";
import { app, db } from "./firebaseClient";

/**
 * Request notification permissions and return the FCM registration token.
 */
export async function requestNotificationPermission(userId?: string): Promise<string | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) {
      console.warn("FCM is not supported in this browser environment.");
      return null;
    }

    if (!("Notification" in window)) {
      console.warn("This browser does not support desktop notification");
      return null;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("Notification permission was not granted.");
      return null;
    }

    // Register or retrieve the unified PWA service worker
    const registration = await navigator.serviceWorker.register("/sw.js");

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      serviceWorkerRegistration: registration,
    });

    if (currentToken) {
      // Save token to Firestore so backend or guardians can push alerts
      try {
        const tokenRef = doc(db, "fcm_tokens", currentToken.slice(0, 32));
        await setDoc(tokenRef, {
          token: currentToken,
          userId: userId || "anonymous",
          updatedAt: new Date().toISOString(),
          userAgent: navigator.userAgent,
        }, { merge: true });
      } catch (err) {
        console.warn("Could not persist FCM token to Firestore:", err);
      }

      return currentToken;
    } else {
      console.warn("No registration token available. Request permission to generate one.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token: ", err);
    return null;
  }
}

/**
 * Listen to foreground FCM messages while user is active on the website.
 */
export async function onForegroundMessage(
  callback: (payload: MessagePayload) => void,
): Promise<(() => void) | null> {
  if (typeof window === "undefined") return null;

  try {
    const supported = await isSupported();
    if (!supported) return null;

    const messaging = getMessaging(app);
    return onMessage(messaging, (payload) => {
      callback(payload);
    });
  } catch (err) {
    console.error("Failed to setup foreground FCM listener:", err);
    return null;
  }
}
