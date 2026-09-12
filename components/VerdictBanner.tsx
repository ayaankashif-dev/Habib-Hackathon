"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Volume2, VolumeX, XOctagon } from "lucide-react";
import { speak, useLang } from "@/lib/i18n";
import type { RiskLevel } from "@/lib/types";

const STYLES: Record<
  RiskLevel,
  {
    bg: string;
    ring: string;
    aura: string;
    text: string;
    badge: string;
    Icon: typeof CheckCircle2;
    pulseClass?: string;
    fg: string;
    pill: string;
  }
> = {
  SAFE: {
    bg: "bg-gradient-to-br from-emerald-600 to-emerald-700",
    ring: "ring-emerald-500/50",
    aura: "shadow-[0_20px_60px_-15px_rgba(5,150,105,0.4)]",
    text: "resultSafeTitle",
    badge: "SAFE • کوئی خطرہ نہیں",
    Icon: CheckCircle2,
    pulseClass: "pulse-safe",
    fg: "text-white",
    pill: "bg-white/20 hover:bg-white/30 text-white",
  },
  CHECK: {
    bg: "bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500",
    ring: "ring-amber-500/60",
    aura: "shadow-[0_20px_60px_-15px_rgba(217,119,6,0.35)]",
    text: "resultCheckTitle",
    badge: "CAUTION • احتیاط کریں",
    Icon: AlertTriangle,
    fg: "text-slate-950",
    pill: "bg-black/15 hover:bg-black/25 text-slate-950",
  },
  STOP: {
    bg: "bg-gradient-to-br from-red-600 via-rose-600 to-red-700",
    ring: "ring-red-500/60",
    aura: "shadow-[0_20px_60px_-15px_rgba(225,29,72,0.45)]",
    text: "resultStopTitle",
    badge: "DANGER • فوراً رک جائیں",
    Icon: XOctagon,
    pulseClass: "pulse-stop",
    fg: "text-white",
    pill: "bg-white/20 hover:bg-white/30 text-white",
  },
};

interface Props {
  riskLevel: RiskLevel;
  reason: string;
}

export default function VerdictBanner({ riskLevel, reason }: Props) {
  const { t, lang } = useLang();
  const [isPlaying, setIsPlaying] = useState(false);
  const style = STYLES[riskLevel];
  const Icon = style.Icon;

  function handleSpeak() {
    if (isPlaying) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    speak(`${t(style.text)}. ${reason}`, lang);

    // Provide visual feedback for speech duration
    const approxDuration = Math.max(3000, reason.length * 80);
    setTimeout(() => {
      setIsPlaying(false);
    }, approxDuration);
  }

  return (
    <motion.div
      key={riskLevel}
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative w-full overflow-hidden rounded-3xl ${style.bg} ${style.pulseClass ?? ""} p-6 sm:p-8 ${style.fg} ${style.aura} ring-4 ${style.ring}`}
    >
      {/* Dynamic ambient highlight */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/15 blur-2xl filter" />

      {/* Top micro badge */}
      <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-black/15 px-3 py-1 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
        <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
        <span>{style.badge}</span>
      </div>

      <div className="flex items-start gap-4 sm:gap-6">
        <motion.div
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.1 }}
          className="shrink-0 rounded-2xl bg-white/15 p-3.5 backdrop-blur-md"
        >
          <Icon aria-hidden className="h-12 w-12 sm:h-16 sm:w-16" strokeWidth={2.4} />
        </motion.div>

        <div className="min-w-0 flex-1">
          <motion.h2
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="text-3xl font-black tracking-tight sm:text-5xl"
          >
            {t(style.text)}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className={`mt-2.5 text-base sm:text-xl font-medium leading-relaxed opacity-95 ${
              lang === "ur" ? "font-urdu text-xl sm:text-2xl pt-1" : ""
            }`}
          >
            {reason}
          </motion.p>
        </div>
      </div>

      {/* Audio Playback Pill with Equalizer */}
      <div className="mt-6 flex items-center justify-between border-t border-white/20 pt-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSpeak}
          aria-label={t("playVerdict")}
          className={`tap-target flex items-center gap-3 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition-all backdrop-blur-md ${style.pill}`}
        >
          {isPlaying ? (
            <>
              <VolumeX aria-hidden className="h-5 w-5" />
              <span>Awaaz band karein</span>
              {/* Equalizer animation */}
              <div className="flex items-center gap-1 pl-1">
                <span className="w-1 rounded-full bg-current animate-bar-1" />
                <span className="w-1 rounded-full bg-current animate-bar-2" />
                <span className="w-1 rounded-full bg-current animate-bar-3" />
                <span className="w-1 rounded-full bg-current animate-bar-4" />
              </div>
            </>
          ) : (
            <>
              <Volume2 aria-hidden className="h-5 w-5" />
              <span>{t("playVerdict")}</span>
            </>
          )}
        </motion.button>

        <span className="text-xs font-medium opacity-75 hidden sm:inline-block">
          Zero Data Stored • Protected Decision
        </span>
      </div>
    </motion.div>
  );
}

