"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  WifiOff,
  RotateCw,
  PhoneCall,
  ShieldAlert,
  ArrowLeft,
  CheckCircle2,
  Lock,
} from "lucide-react";

interface Helpline {
  name: string;
  nameUr: string;
  number: string;
  display: string;
  desc: string;
  descUr: string;
}

const EMERGENCY_HELPLINES: Helpline[] = [
  {
    name: "FIA Cybercrime Helpline",
    nameUr: "ایف آئی اے سائبر کرائم ہیلپ لائن",
    number: "1991",
    display: "1991",
    desc: "Direct federal emergency response for digital harassment, extortion, and cyber fraud.",
    descUr: "آن لائن فراڈ اور ہراسانی کے خلاف فوری کارروائی۔",
  },
  {
    name: "State Bank Financial Fraud Helpline",
    nameUr: "اسٹیٹ بینک ہیلپ لائن",
    number: "02111727273",
    display: "021-111-727-273",
    desc: "Contact immediately if your bank account or card details have been compromised.",
    descUr: "بینک اکاؤنٹ یا کارڈ کی تفصیلات چوری ہونے پر فوری رابطہ کریں۔",
  },
  {
    name: "Easypaisa Fraud Cell",
    nameUr: "ایزی پیسہ فراڈ سیل",
    number: "02111003737",
    display: "021-111-003-737",
    desc: "Block unauthorized wallet transactions or report unauthorized account takeover.",
    descUr: "والٹ کی غیر مجاز لین دین روکنے کیلئے فوری رابطہ۔",
  },
  {
    name: "JazzCash Security Help",
    nameUr: "جاز کیش سیکیورٹی",
    number: "02111124444",
    display: "021-111-124-444",
    desc: "Customer protection & suspicious transaction investigation department.",
    descUr: "مشکوک ٹرانزیکشن رپورٹ کرنے اور اکاونٹ تحفظ کیلئے۔",
  },
];

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      window.location.href = "/";
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleRetry = () => {
    setChecking(true);
    setTimeout(() => {
      if (navigator.onLine) {
        window.location.href = "/";
      } else {
        setChecking(false);
      }
    }, 600);
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-between p-4 sm:p-8">
      {/* Top bar */}
      <header className="w-full max-w-2xl flex items-center justify-between py-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-slate-800 border border-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
            }`}
          />
          {isOnline ? "Reconnected" : "Offline Mode"}
        </div>
      </header>

      {/* Main Content */}
      <section className="w-full max-w-2xl my-auto py-8 space-y-8">
        {/* Offline Status Card */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/20 text-amber-400 shadow-xl">
            <WifiOff className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              You are currently offline
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 max-w-md mx-auto">
              ScamWatch has pre-cached this emergency safety hub so you remain protected even without internet.
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={handleRetry}
              disabled={checking}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} />
              {checking ? "Checking connection..." : "Check Connection Again"}
            </button>
          </div>
        </div>

        {/* Immediate Safe Action Steps */}
        <div className="rounded-2xl bg-slate-800/80 border border-slate-700/60 p-5 shadow-lg space-y-3">
          <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm sm:text-base">
            <ShieldAlert className="w-5 h-5 flex-shrink-0" />
            <span>If someone is pressuring you right now:</span>
          </div>
          <ul className="space-y-2 text-sm text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Never share OTPs or Passwords:</strong> No legitimate bank, courier, or police officer will ever request verification codes over phone or SMS.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Pause and do not transfer funds:</strong> Urgency is the #1 tactic used by scammers to disable your critical thinking.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
              <span>
                <strong>Call the official helpline directly</strong> from a separate phone or dialed number, not by calling back the caller.
              </span>
            </li>
          </ul>
        </div>

        {/* Emergency Helplines Direct Dial */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Direct Emergency Helplines (Available Offline)
            </h2>
            <Lock className="w-3.5 h-3.5 text-slate-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {EMERGENCY_HELPLINES.map((helpline) => (
              <a
                key={helpline.number}
                href={`tel:${helpline.number}`}
                className="group p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 hover:border-indigo-500/50 hover:bg-slate-800 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-white text-sm group-hover:text-indigo-300 transition-colors">
                      {helpline.name}
                    </span>
                    <span className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                      <PhoneCall className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {helpline.desc}
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-700/40 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-mono">Dial:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    {helpline.display}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full max-w-2xl py-4 text-center text-xs text-slate-500">
        ScamWatch PWA • Cached locally for your safety.
      </footer>
    </main>
  );
}
