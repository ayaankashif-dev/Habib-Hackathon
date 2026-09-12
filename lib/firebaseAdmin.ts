// Server-side Firebase Admin helper with dynamic loading for Next.js compatibility

export async function sendAdminPushNotification(options: {
  token?: string;
  topic?: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}): Promise<{ success: boolean; mocked?: boolean; error?: string }> {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "scam-watch-608d9";

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
      await messaging.send({
        token: options.token,
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
      });
    } else {
      await messaging.send({
        topic: options.topic || "scamwatch-alerts",
        notification: {
          title: options.title,
          body: options.body,
        },
        data: options.data || {},
      });
    }

    return { success: true };
  } catch (err: any) {
    console.warn("Firebase Admin push dispatch:", err.message || err);
    // In local dev without service account, gracefully acknowledge
    return {
      success: true,
      mocked: true,
      error: err.message,
    };
  }
}
