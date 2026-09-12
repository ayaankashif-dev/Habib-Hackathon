// Server-side Firebase Cloud Messaging dispatcher
import fs from "fs";
import path from "path";

function getLocalGoogleAccessToken(): string | null {
  try {
    const userProfile = process.env.USERPROFILE || process.env.HOME || "";
    const configPath = path.join(userProfile, ".config", "configstore", "firebase-tools.json");
    if (fs.existsSync(configPath)) {
      const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
      return parsed.tokens?.access_token || null;
    }
  } catch {
    // ignore
  }
  return process.env.FIREBASE_ACCESS_TOKEN || null;
}

export async function sendAdminPushNotification(options: {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; mocked?: boolean; error?: string; messageId?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "scam-watch-608d9";

  // 1. Try FCM HTTP v1 using active CLI/OAuth credentials
  const accessToken = getLocalGoogleAccessToken();
  if (accessToken && options.token) {
    try {
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: {
              token: options.token,
              notification: {
                title: options.title,
                body: options.body,
              },
              data: options.data || { url: "https://habib-hackathon.vercel.app/dashboard", title: options.title, body: options.body },
              webpush: {
                headers: {
                  Urgency: "high",
                },
                notification: {
                  title: options.title,
                  body: options.body,
                  icon: "https://habib-hackathon.vercel.app/icons/icon-192x192.png",
                  badge: "https://habib-hackathon.vercel.app/icons/icon-192x192.png",
                  requireInteraction: "true",
                  vibrate: [200, 100, 200, 100, 200],
                },
                fcm_options: {
                  link: options.data?.url || "https://habib-hackathon.vercel.app/dashboard",
                },
              },
            },
          }),
        }
      );

      const resData = await response.json();
      if (response.ok) {
        return { success: true, messageId: resData.name };
      } else {
        console.warn("FCM v1 returned non-200:", resData);
      }
    } catch (e: any) {
      console.warn("Direct FCM v1 fetch error:", e.message);
    }
  }

  // 2. Fallback to Firebase Admin SDK
  try {
    const { getApps, initializeApp, cert } = await import("firebase-admin/app");
    const { getMessaging } = await import("firebase-admin/messaging");

    let app;
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (serviceAccountKey) {
        try {
          const parsed = JSON.parse(serviceAccountKey);
          app = initializeApp({ credential: cert(parsed), projectId });
        } catch {
          app = initializeApp({ projectId });
        }
      } else {
        app = initializeApp({ projectId });
      }
    }

    const messaging = getMessaging(app);

    if (options.token) {
      const id = await messaging.send({
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
      });
      return { success: true, messageId: id };
    } else {
      const id = await messaging.send({
        topic: options.topic || "scamwatch-alerts",
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
      });
      return { success: true, messageId: id };
    }
  } catch (err: any) {
    console.warn("Firebase Admin push error:", err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}
