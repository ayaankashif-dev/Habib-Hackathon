"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { RadioTower } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { THREAT_FEED } from "@/lib/threatFeed";

const ROTATE_MS = 4500;

export default function ThreatTicker() {
  const { lang } = useLang();
  const messages = THREAT_FEED[lang];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset to the first message whenever the language (and therefore the
    // message array) changes, so the rotation doesn't show a stale index.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIndex(0);
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [messages.length, lang]);

  return (
    <div
      role="marquee"
      aria-live="off"
      className="flex items-center gap-2 overflow-hidden rounded-full bg-slate-900/5 px-3.5 py-2 ring-1 ring-slate-900/5"
    >
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
      </span>
      <RadioTower className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-hidden />
      <div className="relative h-4 flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            className={`absolute inset-0 truncate text-[11px] font-semibold text-slate-500 ${lang === "ur" ? "font-urdu text-xs" : ""}`}
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
