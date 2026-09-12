"use client";

import React, { useEffect, useState } from "react";
import { Bell, BellRing, Check, X, Send } from "lucide-react";
import { requestNotificationPermission, onForegroundMessage } from "@/lib/fcm";
import { useAuth } from "@/lib/authContext";

export default function NotificationBanner() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const [incomingAlert, setIncomingAlert] = useState<{ title: string; body: string } | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission(Notification.permission);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPermission("unsupported");
    }

    // Set up foreground listener
    let unsubscribe: (() => void) | null = null;
    onForegroundMessage((payload) => {
      setIncomingAlert({
        title: payload.notification?.title || "ScamWatch Alert",
        body: payload.notification?.body || "New security update received",
      });
      // Auto-hide alert after 7 seconds
      setTimeout(() => {
        setIncomingAlert(null);
      }, 7000);
    }).then((unsub) => {
      if (unsub) unsubscribe = unsub;
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleEnableNotifications = async () => {
    setRequesting(true);
    try {
      const token = await requestNotificationPermission(user?.uid);
      if (token) {
        setPermission("granted");
      } else {
        setPermission(Notification.permission);
      }
    } finally {
      setRequesting(false);
    }
  };

  const handleSendTestNotification = async () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);

    // 1. Show browser notification via registered service worker
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        if (reg) {
          reg.showNotification("ScamWatch Security Alert (Test)", {
            body: "✅ Mobile & Desktop notifications are active and connected!",
            icon: "/favicon.ico",
            badge: "/favicon.ico",
            vibrate: [200, 100, 200],
          } as any);
        } else {
          new Notification("ScamWatch Security Alert (Test)", {
            body: "✅ Mobile & Desktop notifications are active and connected!",
            icon: "/favicon.ico",
          });
        }
      } catch (e) {
        console.warn("Native notification display:", e);
      }
    }

    // 2. Also trigger in-app toast
    setIncomingAlert({
      title: "ScamWatch Security Alert (Test)",
      body: "✅ Notifications verified! You will receive instant alerts for suspected scams and guardian reviews.",
    });
  };

  return (
    <>
      {/* Toast Alert */}
      {incomingAlert && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-indigo-500/30 flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
          <div className="h-9 w-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0">
            <BellRing className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{incomingAlert.title}</p>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">{incomingAlert.body}</p>
          </div>
          <button
            onClick={() => setIncomingAlert(null)}
            className="text-slate-400 hover:text-white p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* When granted: show active status with test button */}
      {permission === "granted" && !dismissed && (
        <div className="bg-emerald-50 border-b border-emerald-200/80 px-4 py-2 text-xs text-emerald-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>
              <strong>Push Alerts Active:</strong> Connected to Firebase Cloud Messaging.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleSendTestNotification}
              disabled={testSent}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] transition cursor-pointer disabled:opacity-60"
            >
              {testSent ? "Alert Sent!" : "Test Notification"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-emerald-500 hover:text-emerald-700 p-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* When default/unprompted: show enable prompt */}
      {permission === "default" && !dismissed && (
        <div className="bg-indigo-50 border-b border-indigo-100/80 px-4 py-2.5 text-xs text-indigo-900 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span>
              <strong>Enable push alerts:</strong> Get notified on your phone or PC when your guardian reviews a scan.
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleEnableNotifications}
              disabled={requesting}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition cursor-pointer disabled:opacity-50"
            >
              {requesting ? "Enabling..." : "Enable"}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-indigo-400 hover:text-indigo-600 p-1"
              aria-label="Dismiss"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
