"use client";

import { motion } from "framer-motion";
import { ShieldAlert, ShieldCheck, Shield, MessageSquareQuote, AlertTriangle } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { RiskSignal } from "@/lib/types";

interface Props {
  summary: string;
  messageText?: string;
  signals?: RiskSignal[];
  onDecide: (decision: "STOP" | "SAFE") => void;
  disabled?: boolean;
}

export default function GuardianDecisionCard({
  summary,
  messageText,
  signals = [],
  onDecide,
  disabled,
}: Props) {
  const { t, lang } = useLang();

  const flaggedSignals = signals.filter((s) => s.present);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className="relative w-full max-w-md overflow-hidden rounded-3xl glass-panel p-5 sm:p-7 shadow-xl ring-1 ring-slate-900/10 space-y-4"
    >
      {/* Top Security Header */}
      <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-xs">
            <Shield className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
            {lang === "ur" ? "گارڈین فیصلہ کارڈ" : "Guardian Decision Card"}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live Request
        </span>
      </div>

      {/* Received Message Box ("Yeh Message Aaya Tha") */}
      <div className="rounded-2xl border border-indigo-100 bg-white/95 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-1.5 text-indigo-700">
            <MessageSquareQuote className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-wider">
              {t("receivedMessageLabel")}
            </span>
          </div>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
            Incoming
          </span>
        </div>

        <div className="mt-2.5 max-h-56 overflow-y-auto">
          {messageText ? (
            <p
              className={`whitespace-pre-wrap break-words text-sm sm:text-base font-semibold text-slate-900 leading-relaxed select-text ${
                lang === "ur" ? "font-urdu text-lg" : ""
              }`}
            >
              &ldquo;{messageText}&rdquo;
            </p>
          ) : (
            <p className="text-xs sm:text-sm font-medium italic text-slate-500">
              {lang === "ur"
                ? "مشکوک پیغام موصول ہوا تھا، تفصیل نیچے درج ہے۔"
                : lang === "roman-ur"
                  ? "Mashkook message receive hua tha jiski jaanch neeche di gayi hai."
                  : "A suspicious message was received. Analysis is shown below."}
            </p>
          )}
        </div>
      </div>

      {/* ScamWatch Analysis Box */}
      <div className="rounded-2xl bg-amber-50/70 p-4 ring-1 ring-amber-200/70">
        <div className="flex items-center gap-1.5 text-amber-800">
          <AlertTriangle className="h-3.5 w-3.5" />
          <p className="text-[11px] font-black uppercase tracking-wider text-amber-800">
            {t("guardianAnalysisLabel")}
          </p>
        </div>
        <p
          className={`mt-1.5 text-xs sm:text-sm font-bold leading-relaxed text-amber-950 ${
            lang === "ur" ? "font-urdu text-base pt-0.5" : ""
          }`}
        >
          {summary}
        </p>

        {/* Detected Red Flags Badges */}
        {flaggedSignals.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5 pt-1 border-t border-amber-200/60">
            {flaggedSignals.map((s) => (
              <span
                key={s.type}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-red-700 shadow-xs ring-1 ring-red-200"
              >
                <span>⚠️</span>
                <span>{t(`signal_${s.type}`)}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Decision prompt */}
      <p className={`text-center text-xs font-semibold text-slate-600 ${lang === "ur" ? "font-urdu text-sm" : ""}`}>
        {lang === "ur"
          ? "اپنے مشورے کے مطابق نیچے دیے گئے بٹن پر کلک کریں:"
          : lang === "roman-ur"
            ? "Apne mashware ke mutabiq neeche diye gaye button par click karein:"
            : "Please choose your verdict below to guide them:"}
      </p>

      {/* High-Impact Actions */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 pt-1">
        <motion.button
          type="button"
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.03 }}
          whileTap={disabled ? undefined : { scale: 0.96 }}
          onClick={() => onDecide("STOP")}
          className="tap-target relative flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3.5 text-white shadow-lg shadow-red-600/30 ring-2 ring-red-500/50 hover:from-red-700 hover:to-rose-700 disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5 font-black text-base">
            <ShieldAlert aria-hidden className="h-5 w-5" />
            <span>{t("guardianStop")}</span>
          </div>
          <span className="text-[11px] text-red-100 font-medium">
            {lang === "ur" ? "(فراڈ لگتا ہے)" : lang === "roman-ur" ? "(Scam lagta hai)" : "(Likely a scam)"}
          </span>
        </motion.button>

        <motion.button
          type="button"
          disabled={disabled}
          whileHover={disabled ? undefined : { scale: 1.03 }}
          whileTap={disabled ? undefined : { scale: 0.96 }}
          onClick={() => onDecide("SAFE")}
          className="tap-target relative flex flex-col items-center justify-center gap-0.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3.5 text-white shadow-lg shadow-emerald-600/30 ring-2 ring-emerald-500/50 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50"
        >
          <div className="flex items-center gap-1.5 font-black text-base">
            <ShieldCheck aria-hidden className="h-5 w-5" />
            <span>{t("guardianSafe")}</span>
          </div>
          <span className="text-[11px] text-emerald-100 font-medium">
            {lang === "ur" ? "(محفوظ ہے)" : lang === "roman-ur" ? "(Safe lagta hai)" : "(Looks genuine)"}
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}
