"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, GraduationCap } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { RiskSignal } from "@/lib/types";

export default function WhyFlagged({ signals }: { signals: RiskSignal[] }) {
  const { t, lang } = useLang();
  const [open, setOpen] = useState(false);
  const present = signals.filter((s) => s.present);

  if (present.length === 0) return null;

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="tap-target flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className={`flex items-center gap-2 font-semibold text-slate-800 ${lang === "ur" ? "font-urdu" : ""}`}>
          <GraduationCap aria-hidden className="h-5 w-5 shrink-0 text-slate-500" />
          {t("whyFlagged")}
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown aria-hidden className="h-5 w-5 text-slate-400" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <ul className="flex flex-col gap-3 px-4 pb-4">
              {present.map((s) => (
                <li
                  key={s.type}
                  className={`text-sm leading-snug text-slate-600 ${lang === "ur" ? "font-urdu text-base" : ""}`}
                >
                  {t(`lesson_${s.type}`)}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
