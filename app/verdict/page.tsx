"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  Loader2,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import VerdictBanner from "@/components/VerdictBanner";
import RiskCard from "@/components/RiskCard";
import WhyFlagged from "@/components/WhyFlagged";
import FamilyWarningCard from "@/components/FamilyWarningCard";
import HelplinesModal from "@/components/HelplinesModal";
import ReportScammerCard from "@/components/ReportScammerCard";
import { useLang } from "@/lib/i18n";
import { clearPendingAnalysis, loadPendingAnalysis, type PendingAnalysis } from "@/lib/session";
import { buildWhatsAppLink, loadGuardianProfile, type GuardianProfile } from "@/lib/guardianProfile";

export default function VerdictPage() {
  const { t, lang } = useLang();
  const router = useRouter();

  const [pending, setPending] = useState<PendingAnalysis | null>(null);
  const [markedSafe, setMarkedSafe] = useState(false);
  const [requestingGuardian, setRequestingGuardian] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardianProfile, setGuardianProfile] = useState<GuardianProfile | null>(null);
  const [showFamilyCard, setShowFamilyCard] = useState(false);
  const [showHelplines, setShowHelplines] = useState(false);

  useEffect(() => {
    // sessionStorage/localStorage only exist client-side, so neither can be
    // a lazy useState initializer without risking an SSR/hydration mismatch.
    const p = loadPendingAnalysis();
    if (!p) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPending(p);
    setGuardianProfile(loadGuardianProfile());
  }, [router]);

  if (!pending) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  async function askTrustedPerson() {
    if (!pending) return;
    setRequestingGuardian(true);
    setError(null);
    try {
      const res = await fetch("/api/relay", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          analysis: pending.analysis,
          inputType: pending.inputType,
          lang,
          rawInputRef: pending.text,
          messageText: pending.text,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(res.status === 503 ? t("setupRequired") : t("aiUnavailable"));
        setRequestingGuardian(false);
        return;
      }

      if (guardianProfile) {
        const guardianUrl = data.guardianUrl
          ? `${window.location.origin}${data.guardianUrl}`
          : `${window.location.origin}/guardian/${data.caseId}?msg=${encodeURIComponent(pending.text)}`;
        const preview = pending.text ? (pending.text.length > 120 ? `${pending.text.slice(0, 120)}...` : pending.text) : "";
        const message = preview
          ? (lang === "ur"
              ? `السلام علیکم! مجھے یہ پیغام ملا ہے:\n"${preview}"\n\nبراہ کرم چیک کریں کہ یہ محفوظ ہے یا فراڈ:\n${guardianUrl}`
              : lang === "roman-ur"
                ? `Assalam-o-Alaikum! Mujhe yeh message aaya tha:\n"${preview}"\n\nPlease check karein ke yeh safe hai ya fraud:\n${guardianUrl}`
                : `Assalam-o-Alaikum! I received this message:\n"${preview}"\n\nPlease check if it is safe or a scam:\n${guardianUrl}`)
          : (lang === "ur"
              ? `السلام علیکم! براہ کرم میرے لیے یہ پیغام چیک کریں:\n${guardianUrl}`
              : lang === "roman-ur"
                ? `Assalam-o-Alaikum! Please mere liye yeh message check karein:\n${guardianUrl}`
                : `Assalam-o-Alaikum! Please check this message for me:\n${guardianUrl}`);
        window.open(buildWhatsAppLink(guardianProfile.whatsapp, message), "_blank");
      }

      router.push(`/case/${data.caseId}`);
    } catch {
      setError(t("aiUnavailable"));
      setRequestingGuardian(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tap-target inline-flex items-center gap-1.5 rounded-full glass-panel-subtle px-4 py-2 text-xs sm:text-sm font-bold text-slate-700 shadow-xs ring-1 ring-slate-200/80 hover:bg-white transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t("back")}</span>
        </button>
        <LanguageToggle />
      </header>

      {/* Hero Verdict Banner */}
      <VerdictBanner riskLevel={pending.analysis.riskLevel} reason={pending.analysis.plainLanguageReason} />

      {pending.repeatedPattern && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 rounded-2xl bg-purple-50 p-4 text-sm font-bold text-purple-900 ring-1 ring-purple-200 shadow-xs"
        >
          <History aria-hidden className="h-5 w-5 shrink-0 text-purple-600" />
          <span className={lang === "ur" ? "font-urdu text-base" : ""}>{t("repeatedPatternNotice")}</span>
        </motion.div>
      )}

      {/* Red Flags & Lessons */}
      <RiskCard signals={pending.analysis.signals} />

      <WhyFlagged signals={pending.analysis.signals} />

      {/* Community Report Prompt for Scam Numbers/Emails */}
      {pending.analysis.riskLevel !== "SAFE" && (
        <ReportScammerCard
          initialContact={pending.senderContact || ""}
          messageSnippet={pending.text}
          riskScore={pending.analysis.riskLevel === "STOP" ? 95 : 65}
          scamType={pending.analysis.plainLanguageReason}
        />
      )}

      {/* Recommended Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="rounded-3xl glass-panel p-5 sm:p-6 text-slate-800 shadow-sm ring-1 ring-slate-900/5"
      >
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-indigo-700">
          <ShieldCheck className="h-4 w-4 text-indigo-600" />
          <span>{lang === "ur" ? "آپ کو کیا کرنا چاہیے؟" : lang === "roman-ur" ? "Aapko kya karna chahiye?" : "Recommended Action"}</span>
        </div>
        <p className={`text-base sm:text-lg font-bold leading-relaxed text-slate-900 ${lang === "ur" ? "font-urdu text-xl pt-1" : ""}`}>
          {pending.analysis.recommendedAction}
        </p>
      </motion.div>

      {/* Action Buttons */}
      <AnimatePresence mode="wait">
        {!markedSafe ? (
          <motion.div
            key="actions"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <motion.button
                type="button"
                onClick={askTrustedPerson}
                disabled={requestingGuardian}
                whileHover={requestingGuardian ? undefined : { scale: 1.02 }}
                whileTap={requestingGuardian ? undefined : { scale: 0.97 }}
                className="tap-target relative flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-5 py-4 text-base sm:text-lg font-black text-white shadow-xl shadow-slate-950/20 ring-2 ring-slate-800 hover:from-slate-900 hover:to-indigo-900 disabled:opacity-50"
              >
                {requestingGuardian ? (
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                ) : guardianProfile ? (
                  <MessageCircle className="h-5 w-5 text-emerald-400" />
                ) : (
                  <UsersRound className="h-5 w-5 text-emerald-400" />
                )}
                <span>
                  {guardianProfile
                    ? t("askOnWhatsAppTemplate").replace("{name}", guardianProfile.name)
                    : t("askTrustedPerson")}
                </span>
              </motion.button>

              <motion.button
                type="button"
                onClick={() => setMarkedSafe(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="tap-target flex items-center justify-center gap-2 rounded-2xl glass-panel px-5 py-4 text-base sm:text-lg font-bold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-white hover:text-slate-900 transition-all"
              >
                {t("iKnowSafe")}
              </motion.button>
            </div>

            {pending.analysis.riskLevel === "STOP" && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <motion.button
                  type="button"
                  onClick={() => setShowFamilyCard(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="tap-target flex items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3.5 text-sm sm:text-base font-bold text-red-700 ring-1 ring-red-200 hover:bg-red-100"
                >
                  <MessageCircle className="h-5 w-5" />
                  {t("warnFamilyGroup")}
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setShowHelplines(true)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className="tap-target flex items-center justify-center gap-2 rounded-2xl bg-slate-50 px-4 py-3.5 text-sm sm:text-base font-bold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100"
                >
                  <PhoneCall className="h-5 w-5" />
                  {t("emergencyHelplines")}
                </motion.button>
              </div>
            )}

            {/* Privacy reassurance footer */}
            <p className="text-center text-xs font-medium text-slate-500">
              🔒 {lang === "ur" ? "آپ کا نجی پیغام کسی کو نہیں دکھایا جاتا۔ صرف خطرے کا خلاصہ بھیجا جائے گا۔" : "Your private chat is hidden. Your guardian only sees a brief risk summary."}
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="marked-safe"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4 rounded-3xl glass-panel p-6 text-center shadow-lg ring-1 ring-slate-900/5"
          >
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <CheckCircle2 className="h-12 w-12 text-emerald-600" />
            </motion.div>
            <p className={`text-lg font-bold text-slate-900 ${lang === "ur" ? "font-urdu text-xl" : ""}`}>
              {t("markedSafeByYou")}
            </p>
            <button
              type="button"
              onClick={() => {
                clearPendingAnalysis();
                router.push("/");
              }}
              className="tap-target rounded-full bg-slate-900 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-slate-800"
            >
              {t("startOver")}
            </button>
          </motion.div>
        )}
      </AnimatePresence>


      {error && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm font-semibold text-red-600"
        >
          {error}
        </motion.p>
      )}

      <FamilyWarningCard
        open={showFamilyCard}
        onClose={() => setShowFamilyCard(false)}
        analysis={pending.analysis}
      />
      <HelplinesModal open={showHelplines} onClose={() => setShowHelplines(false)} />
    </main>
  );
}
