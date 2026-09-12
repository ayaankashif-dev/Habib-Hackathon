import { NextRequest, NextResponse } from "next/server";
import { sendAdminPushNotification } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { collection, getDocs } = await import("firebase/firestore");
    const { db } = await import("@/lib/firebaseClient");
    const snap = await getDocs(collection(db, "fcm_tokens"));
    const tokens: Array<{ token: string; userId: string; updatedAt: string; userAgent?: string }> = [];
    snap.forEach((doc) => {
      const d = doc.data();
      tokens.push({
        token: d.token ? `${d.token.slice(0, 20)}...` : "unknown",
        userId: d.userId || "anonymous",
        updatedAt: d.updatedAt,
        userAgent: d.userAgent,
      });
    });
    return NextResponse.json({
      registeredDevicesCount: tokens.length,
      devices: tokens,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, topic, title, message, data, sendToAll } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Missing title or message" }, { status: 400 });
    }

    if (!token && sendToAll) {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebaseClient");
      const snap = await getDocs(collection(db, "fcm_tokens"));
      const tokensList: string[] = [];
      snap.forEach((doc) => {
        const t = doc.data().token;
        if (t) tokensList.push(t);
      });

      const results = [];
      for (const singleToken of tokensList) {
        results.push(
          await sendAdminPushNotification({
            token: singleToken,
            title,
            body: message,
            data,
          })
        );
      }

      return NextResponse.json({
        success: true,
        sentToCount: tokensList.length,
        results,
      });
    }

    const result = await sendAdminPushNotification({
      token,
      topic,
      title,
      body: message,
      data,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Failed to send push notification:", err);
    return NextResponse.json(
      { error: err.message || "Failed to send notification" },
      { status: 500 },
    );
  }
}
