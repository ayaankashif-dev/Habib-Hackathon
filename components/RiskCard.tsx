"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Clock,
  EyeOff,
  Link2,
  KeyRound,
  UserRoundX,
  ChevronDown,
  AlertCircle,
  type LucideIcon,
} from "lucide-react";
import { useLang } from "@/lib/i18n";
import type { RiskSignal, SignalType } from "@/lib/types";

const ICONS: Record<SignalType, LucideIcon> = {
  money_request: Banknote,
  urgency: Clock,
  secrecy: EyeOff,
  impersonation: UserRoundX,
  link: Link2,
  credential_request: KeyRound,
};

const LESSONS: Record<SignalType, { en: string; ur: string; "roman-ur": string }> = {
  money_request: {
    en: "Scammers ask for direct bank transfers, Easypaisa, or JazzCash so the payment cannot be reversed.",
    ur: "دھوکے باز بینک یا ایزی پیسہ کے ذریعے رقم مانگتے ہیں تاکہ پیسے واپس نہ مل سکیں۔",
    "roman-ur": "Scammers seedha Easypaisa ya JazzCash mangte hain taake paise wapis na ho sakein.",
  },
  urgency: {
    en: "Creating panic prevents you from thinking clearly or consulting anyone before you send money.",
    ur: "جلدی کا خوف پیدا کیا جاتا ہے تاکہ آپ سوچ سمجھ کر کسی سے پوچھ نہ سکیں۔",
    "roman-ur": "Jaldi ka dabao is liye dala jata hai taake aap kisi se mashwara na kar sakein.",
  },
  secrecy: {
    en: "Real family members or banks never tell you to hide financial transfers from everyone.",
    ur: "کوئی سچا رشتہ دار یا بینک آپ کو بات خفیہ رکھنے کا نہیں کہتا۔",
    "roman-ur": "Asli rishtedaar ya bank kabhi kisi se raaz rakhne ko nahi kehta.",
  },
  impersonation: {
    en: "Voice clones and fake numbers are used to claim an emergency with a relative.",
    ur: "آواز کی نقل یا نئے نمبر سے جھوٹے حادثے کا ڈرامہ کیا جاتا ہے۔",
    "roman-ur": "Awaaz ki naqal ya naye number se rishtedaar ban kar baat ki jaati hai.",
  },
  link: {
    en: "Links and fake apps (APKs) can steal your bank login or hijack your WhatsApp.",
    ur: "مشکوک لنکس یا ایپس آپ کا واٹس ایپ یا بینک اکاؤنٹ ہیک کر سکتے ہیں۔",
    "roman-ur": "Anjaan link ya APK app se aapka mobile ya bank hack ho sakta hai.",
  },
  credential_request: {
    en: "Never share OTP codes or passwords — no bank or service ever needs your code.",
    ur: "اپنا او ٹی پی یا پاسورڈ کبھی کسی کو نہ دیں — بینک کبھی کوڈ نہیں مانگتا۔",
    "roman-ur": "Apna OTP code ya password kisi ko na dein — bank kabhi nahi maangta.",
  },
};

export default function RiskCard({ signals }: { signals: RiskSignal[] }) {
  const { t, lang } = useLang();
  const [expanded, setExpanded] = useState<SignalType | null>(null);
  const present = signals.filter((s) => s.present);

  if (present.length === 0) return null;

  return (
    <div className="w-full space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-800">
          <AlertCircle className="h-4 w-4" />
          <span>{lang === "ur" ? "مشکوک نشانیاں جو پکڑی گئیں" : lang === "roman-ur" ? "Mashkook nishaniyan jo mili" : "Red Flags Detected"}</span>
        </div>
        <span className="text-xs text-slate-500 font-medium">
          {lang === "ur" ? "تفصیل کے لیے کلک کریں" : lang === "roman-ur" ? "Tap kar ke seekhein" : "Tap to learn why"}
        </span>
      </div>

      <motion.ul
        className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.05, delayChildren: 0.25 } } }}
      >
        {present.map((s) => {
          const Icon = ICONS[s.type];
          const isSelected = expanded === s.type;
          const lesson = LESSONS[s.type]?.[lang] ?? LESSONS[s.type]?.en;

          return (
            <motion.li
              key={s.type}
              variants={{
                hidden: { opacity: 0, y: 10, scale: 0.95 },
                show: { opacity: 1, y: 0, scale: 1 },
              }}
              transition={{ type: "spring", stiffness: 320, damping: 22 }}
              className={`overflow-hidden rounded-2xl border transition-all ${
                isSelected
                  ? "bg-rose-50/90 border-rose-300 ring-2 ring-rose-400/30 shadow-sm"
                  : "bg-white/90 hover:bg-rose-50/50 border-rose-200/80 shadow-xs"
              }`}
            >
              <button
                type="button"
                onClick={() => setExpanded(isSelected ? null : s.type)}
                className="flex w-full items-center justify-between p-3.5 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                    <Icon aria-hidden className="h-5 w-5" />
                  </div>
                  <span
                    className={`text-sm font-bold text-slate-900 ${
                      lang === "ur" ? "font-urdu text-base pt-0.5" : ""
                    }`}
                  >
                    {t(`signal_${s.type}`)}
                  </span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                    isSelected ? "rotate-180 text-rose-600" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-rose-200/60 bg-rose-100/40 px-4 py-3 text-xs text-rose-950"
                  >
                    <p className={`leading-relaxed ${lang === "ur" ? "font-urdu text-sm" : "font-medium"}`}>
                      {lesson}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </motion.ul>
    </div>
  );
}

