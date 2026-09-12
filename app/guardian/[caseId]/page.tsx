"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Loader2, ShieldQuestion } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import GuardianDecisionCard from "@/components/GuardianDecisionCard";
import { useLang } from "@/lib/i18n";
import type { Case } from "@/lib/types";

function GuardianReviewContent() {
  const { caseId } = useParams<{ caseId: string }>();
  const searchParams = useSearchParams();
  const queryMsg = searchParams.get("msg") || undefined;
  const { t, lang } = useLang();

  const [c, setC] = useState<Case | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [justDecided, setJustDecided] = useState(false);

  useEffect(() => {
    fetch(`/api/relay/${caseId}`)
      .then(async (r) => {
        if (r.status === 503) {
          const data = await r.json();
          setConfigError(data.error);
          return null;
        }
        return r.ok ? r.json() : Promise.reject();
      })
      .then((data) => data && setC(data))
      .catch(() => setNotFound(true));
  }, [caseId]);

  async function decide(decision: "STOP" | "SAFE") {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/relay/${caseId}/decide`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await res.json();
      if (res.ok) {
        setC(data);
        setJustDecided(true);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (configError) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <p className="max-w-md text-sm font-semibold text-amber-700">{configError}</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <p className="text-lg font-semibold text-slate-700">{t("caseNotFound")}</p>
      </main>
    );
  }

  if (!c) {
    return (
      <main className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </main>
    );
  }

  const resolved = c.status === "resolved_safe" || c.status === "resolved_stop";
  const exactMessage = (c.rawInputRef && c.rawInputRef !== "not-stored" ? c.rawInputRef : null) || queryMsg;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center gap-6 px-4 py-6 sm:py-10">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex w-full items-center justify-between gap-4"
      >
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white shadow-xs">
            <ShieldQuestion className="h-5 w-5 text-indigo-400" />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-950">{t("appName")}</span>
        </div>
        <LanguageToggle />
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col items-center gap-2 text-center max-w-sm"
      >
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 18 }}
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-900 to-slate-900 text-white shadow-md ring-4 ring-indigo-100"
        >
          <ShieldQuestion className="h-9 w-9 text-indigo-300" />
        </motion.div>
        <h2 className={`text-2xl font-black text-slate-950 ${lang === "ur" ? "font-urdu text-3xl" : ""}`}>
          {t("guardianTitle")}
        </h2>
        <p className={`text-xs sm:text-sm text-slate-500 leading-relaxed ${lang === "ur" ? "font-urdu text-base" : ""}`}>
          {t("guardianSubtitle")}
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {resolved ? (
          <motion.div
            key="resolved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex w-full max-w-md flex-col items-center gap-4 rounded-3xl glass-panel p-8 text-center shadow-lg ring-1 ring-slate-900/5"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 16 }}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"
            >
              <CheckCircle2 className="h-10 w-10" />
            </motion.div>
            <h3 className={`text-xl font-bold text-slate-950 ${lang === "ur" ? "font-urdu text-2xl" : ""}`}>
              {justDecided ? t("guardianThanks") : t("guardianAlreadyDecided")}
            </h3>
            <p className="text-xs font-medium text-slate-500">
              The victim&apos;s phone has been updated instantly with your decision.
            </p>
          </motion.div>
        ) : (
          <GuardianDecisionCard
            key="decide"
            summary={c.guardianEvidenceSummary}
            messageText={exactMessage}
            signals={c.analysis?.signals}
            onDecide={decide}
            disabled={submitting}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default function GuardianReviewPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </main>
      }
    >
      <GuardianReviewContent />
    </Suspense>
  );
}
