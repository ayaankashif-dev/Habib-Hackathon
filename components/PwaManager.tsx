"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Download,
  Share2,
  X,
  WifiOff,
  CheckCircle2,
  Smartphone,
  PlusSquare,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showOnlineToast, setShowOnlineToast] = useState(false);

  useEffect(() => {
    // 1. Check if running in standalone PWA mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if dismissed previously in this session
    if (sessionStorage.getItem("pwa_install_dismissed") === "true") {
      setIsDismissed(true);
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice =
      /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    setIsIos(isIosDevice);

    // 3. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);

          // Listen for updates
          reg.addEventListener("updatefound", () => {
            const newWorker = reg.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("[PWA] New version available.");
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration failed:", err);
        });
    }

    // 4. Capture BeforeInstallPrompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      console.log("[PWA] ScamWatch installed successfully");
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // 5. Monitor Network State
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      setShowOnlineToast(true);
      const timer = setTimeout(() => setShowOnlineToast(false), 3500);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      if (isIos) {
        setShowIosGuide(true);
      }
      return;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted installation prompt");
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        console.log("[PWA] User dismissed installation prompt");
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem("pwa_install_dismissed", "true");
  };

  return (
    <>
      {/* Offline Alert Bar */}
      <AnimatePresence>
        {!isOnline && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-0 inset-x-0 z-50 bg-amber-500 text-slate-950 px-4 py-2 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <WifiOff className="w-4 h-4" />
            <span>You are currently offline. ScamWatch offline safety mode is active.</span>
            <a
              href="/offline"
              className="underline font-bold hover:text-white transition-colors ml-1"
            >
              View Helplines
            </a>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Online Restored Toast */}
      <AnimatePresence>
        {showOnlineToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xl border border-emerald-400/30"
          >
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span>Back online! Full analysis restored.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install PWA Prompt Banner */}
      <AnimatePresence>
        {!isInstalled && !isDismissed && (isInstallable || (isIos && !showIosGuide)) && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-40 sm:max-w-sm rounded-2xl bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 p-4 shadow-2xl shadow-indigo-950/50 text-white"
          >
            <div className="flex items-start gap-3">
              {/* App Icon preview */}
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-slate-900 flex items-center justify-center p-1 shadow-inner border border-indigo-400/30 flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/icons/icon-192x192.png"
                  alt="ScamWatch"
                  className="w-10 h-10 object-contain rounded-lg"
                />
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                    <span>Install ScamWatch</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      App
                    </span>
                  </h3>
                  <button
                    onClick={handleDismiss}
                    aria-label="Dismiss install banner"
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 mt-1">
                  Add to home screen for instant scam scanning and 1-tap guardian alerts.
                </p>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    onClick={handleInstallClick}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install Now</span>
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* iOS Safari Installation Guide Modal */}
      <AnimatePresence>
        {showIosGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4"
            onClick={() => setShowIosGuide(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 text-white shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base">Install on iPhone / iPad</h3>
                </div>
                <button
                  onClick={() => setShowIosGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300">
                Safari on iOS lets you install ScamWatch directly as an app:
              </p>

              <ol className="space-y-3 text-xs text-slate-200">
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>
                    Tap the <strong>Share</strong> button{" "}
                    <Share2 className="w-4 h-4 inline text-indigo-400 align-text-bottom mx-1" /> in
                    Safari&apos;s bottom navigation bar.
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>
                    Scroll down and select{" "}
                    <strong className="text-indigo-300">Add to Home Screen</strong>{" "}
                    <PlusSquare className="w-4 h-4 inline text-indigo-400 align-text-bottom mx-1" />.
                  </span>
                </li>
                <li className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/70 border border-slate-700/50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>
                    Tap <strong>Add</strong> in the top-right corner.
                  </span>
                </li>
              </ol>

              <button
                onClick={() => setShowIosGuide(false)}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-bold text-xs text-white transition-colors"
              >
                Got It
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
