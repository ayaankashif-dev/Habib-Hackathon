"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import html2canvas from "html2canvas";
import { AlertTriangle, MessageSquareWarning, Share2, ShieldAlert, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { AnalysisResult } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  analysis: AnalysisResult;
}

export default function FamilyWarningCard({ open, onClose, analysis }: Props) {
  const { t, lang } = useLang();
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);

  const presentSignals = analysis.signals.filter((s) => s.present);

  function buildShareText(): string {
    const bullets = presentSignals.map((s) => `• ${t(`signal_${s.type}`)}`).join("\n");
    return (
      `🚨 *${t("fraudAlertTitle")}*\n\n` +
      `*${t("fraudAlertWarning")}*\n\n` +
      `${analysis.plainLanguageReason}\n\n` +
      (bullets ? `${bullets}\n\n` : "") +
      `— ScamWatch`
    );
  }

  async function handleShareImage() {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const canvas = await html2canvas(cardRef.current, { backgroundColor: "#ffffff", scale: 2 });
      canvas.toBlob(async (blob) => {
        if (!blob) {
          setBusy(false);
          return;
        }
        const file = new File([blob], "scamwatch-fraud-alert.png", { type: "image/png" });
        const canShareFiles = "canShare" in navigator && navigator.canShare?.({ files: [file] });

        if (canShareFiles && navigator.share) {
          try {
            await navigator.share({ files: [file], title: t("fraudAlertTitle"), text: buildShareText() });
          } catch {
            // user cancelled the native share sheet — not an error
          }
        } else {
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = "scamwatch-fraud-alert.png";
          link.click();
          URL.revokeObjectURL(link.href);
        }
        setBusy(false);
      }, "image/png");
    } catch {
      setBusy(false);
    }
  }

  function handleShareText() {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(buildShareText())}`, "_blank");
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-slate-50 p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between px-1">
              <span className="text-sm font-bold text-slate-700">{t("warnFamilyGroup")}</span>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeModal")}
                className="tap-target rounded-full p-2 text-slate-400 hover:bg-slate-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* The actual shareable card — captured by html2canvas as-is */}
            <div ref={cardRef} className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
              <div className="bg-gradient-to-br from-red-600 to-rose-700 p-5 text-white">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="h-6 w-6" />
                  <span className="text-lg font-black tracking-tight">{t("fraudAlertTitle")}</span>
                </div>
                <p className="mt-2 text-sm font-extrabold uppercase tracking-wide">{t("fraudAlertWarning")}</p>
              </div>
              <div className="p-5">
                <p className={`text-sm font-semibold text-slate-800 ${lang === "ur" ? "font-urdu text-base" : ""}`}>
                  {analysis.plainLanguageReason}
                </p>
                {presentSignals.length > 0 && (
                  <ul className="mt-3 space-y-1.5">
                    {presentSignals.map((s) => (
                      <li key={s.type} className="flex items-center gap-2 text-xs font-bold text-red-700">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {t(`signal_${s.type}`)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-4 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Checked with ScamWatch — Your Digital Guardian
                </p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleShareImage}
                disabled={busy}
                className="tap-target flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-3 py-3 text-xs sm:text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                <Share2 className="h-4 w-4" />
                {busy ? t("generatingCard") : t("shareAsImage")}
              </button>
              <button
                type="button"
                onClick={handleShareText}
                className="tap-target flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-3 py-3 text-xs sm:text-sm font-bold text-white hover:bg-[#20bd5a]"
              >
                <MessageSquareWarning className="h-4 w-4" />
                {t("shareAsText")}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
