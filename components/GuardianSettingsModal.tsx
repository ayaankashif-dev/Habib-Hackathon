"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Phone, Save, Trash2, UserRoundCog, X } from "lucide-react";
import { useLang } from "@/lib/i18n";
import { clearGuardianProfile, loadGuardianProfile, saveGuardianProfile } from "@/lib/guardianProfile";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export default function GuardianSettingsModal({ open, onClose, onSaved }: Props) {
  const { t, lang } = useLang();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    // localStorage read is deliberately deferred to an effect keyed on
    // `open` — it re-syncs the form from storage each time the modal opens.
    if (!open) return;
    const existing = loadGuardianProfile();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setName(existing?.name ?? "");
    setPhone(existing?.whatsapp ?? "");
  }, [open]);

  function handleSave() {
    if (!name.trim() || !phone.trim()) return;
    saveGuardianProfile({ name, whatsapp: phone });
    onSaved();
    onClose();
  }

  function handleClear() {
    clearGuardianProfile();
    setName("");
    setPhone("");
    onSaved();
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-black/5"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                  <UserRoundCog className="h-5 w-5" />
                </div>
                <h2 className={`text-lg font-black text-slate-950 ${lang === "ur" ? "font-urdu text-xl" : ""}`}>
                  {t("guardianProfileTitle")}
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

            <p className={`mb-4 text-xs text-slate-500 ${lang === "ur" ? "font-urdu text-sm" : ""}`}>
              {t("guardianProfileSubtitle")}
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t("guardianNameLabel")}
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Beta Bilal"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-wide text-slate-500">
                  {t("guardianPhoneLabel")}
                </label>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 focus-within:border-indigo-500">
                  <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    inputMode="tel"
                    className="w-full text-sm text-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={!name.trim() || !phone.trim()}
                className="tap-target flex flex-1 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                <Save className="h-4 w-4" />
                {t("saveGuardian")}
              </button>
              {(name || phone) && (
                <button
                  type="button"
                  onClick={handleClear}
                  aria-label={t("removeGuardian")}
                  className="tap-target rounded-xl px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
