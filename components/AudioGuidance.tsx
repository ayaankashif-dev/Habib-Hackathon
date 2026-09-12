"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Volume2, VolumeX } from "lucide-react";
import { speak, useLang } from "@/lib/i18n";

export default function AudioGuidance() {
  const { t, lang } = useLang();
  const [playing, setPlaying] = useState(false);

  function toggle() {
    if (playing) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setPlaying(false);
      return;
    }

    const greeting = t("welcomeGreeting");
    setPlaying(true);
    speak(greeting, lang);

    const approxDuration = Math.max(3000, greeting.length * 80);
    setTimeout(() => setPlaying(false), approxDuration);
  }

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? t("stopGreeting") : t("listenGreeting")}
      className={`tap-target flex items-center gap-2 rounded-full px-4 py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all ${
        playing ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-100"
      }`}
    >
      {playing ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      <span>{playing ? t("stopGreeting") : t("listenGreeting")}</span>
    </motion.button>
  );
}
