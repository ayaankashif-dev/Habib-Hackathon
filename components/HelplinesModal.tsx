"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Phone, PhoneCall, ShieldAlert, X } from "lucide-react";
import { useLang } from "@/lib/i18n";

interface Helpline {
  labelKey: string;
  number: string;
  display: string;
}

const HELPLINES: Helpline[] = [
  { labelKey: "fiaCyber", number: "1991", display: "1991" },
  { labelKey: "sbpFraud", number: "02111727273", display: "021-111-727-273" },
  { labelKey: "easypaisaHelp", number: "02111003737", display: "021-111-003-737" },
  { labelKey: "jazzcashHelp", number: "02111124444", display: "021-111-124-444" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HelplinesModal({ open, onClose }: Props) {
  const { t, lang } = useLang();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-100 text-red-700">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <h2 className={`text-lg font-black text-slate-950 ${lang === "ur" ? "font-urdu text-xl" : ""}`}>
                  {t("emergencyHelplines")}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t("closeModal")}
                className="tap-target rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <ul className="space-y-2.5">
              {HELPLINES.map((h) => (
                <li key={h.labelKey}>
                  <a
                    href={`tel:${h.number}`}
                    className="tap-target flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3.5 ring-1 ring-slate-200 hover:bg-slate-100"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold text-slate-900 ${lang === "ur" ? "font-urdu text-base" : ""}`}>
                          {t(h.labelKey)}
                        </p>
                        <p className="font-mono text-xs text-slate-500">{h.display}</p>
                      </div>
                    </div>
                    <PhoneCall className="h-4 w-4 shrink-0 text-emerald-600" />
                  </a>
                </li>
              ))}
            </ul>

            <p className={`mt-4 text-center text-[11px] leading-relaxed text-slate-400 ${lang === "ur" ? "font-urdu text-xs" : ""}`}>
              {t("helplineDisclaimer")}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
