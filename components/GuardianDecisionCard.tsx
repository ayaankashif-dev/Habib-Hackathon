"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Lock, Shield } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface Props {
  summary: string;
  onDecide: (decision: "STOP" | "SAFE") => void;
  disabled?: boolean;
}

export default function GuardianDecisionCard({ summary, onDecide, disabled }: Props) {
  const { t, lang } = useLang();

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl glass-panel p-6 sm:p-7 shadow-xl ring-1 ring-slate-900/10"
    >
      {/* Top Security Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3.5">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {lang === "ur" ? "گارڈین پروٹیکشن کنسول" : "Guardian Decision Card"}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Request
        </span>
      </div>

      {/* Evidence Summary Box */}
      <div className="mt-4 rounded-2xl bg-slate-50/90 p-4 ring-1 ring-slate-200/70">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {t("evidenceSummary")}
        </p>
        <p className={`mt-2 text-lg font-bold leading-snug text-slate-900 ${lang === "ur" ? "font-urdu text-xl pt-1" : ""}`}>
          {summary}
        </p>
      </div>

      {/* Privacy note */}
      <div className="mt-3 flex items-center gap-2 text-[11px] font-medium text-slate-500">
        <Lock className="h-3 w-3 text-slate-400" />
        <span>Private chat is hidden. You only see risk signals.</span>
      </div>

      {/* High-Impact Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.03 }}
          whileTap={disabled ? undefined : { scale: 0.96 }}
          onClick={() => onDecide("STOP")}
          className="tap-target relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-4 text-base font-black text-white shadow-lg shadow-red-600/30 ring-2 ring-red-500/50 hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
        >
          <ShieldAlert aria-hidden className="h-5 w-5" />
          <span>{t("guardianStop")}</span>
        </motion.button>

        <motion.button
          type="button"
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.03 }}
          whileTap={disabled ? undefined : { scale: 0.96 }}
          onClick={() => onDecide("SAFE")}
          className="tap-target relative flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/50 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
        >
          <ShieldCheck aria-hidden className="h-5 w-5" />
          <span>{t("guardianSafe")}</span>
        </motion.button>
      </div>
    </motion.div>
  );
}

