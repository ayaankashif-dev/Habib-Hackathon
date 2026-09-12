"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Copy, ExternalLink, Loader2, ShieldAlert, ShieldCheck } from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import VerdictBanner from "@/components/VerdictBanner";
import GuardianQrCode from "@/components/QrCode";
import { useLang } from "@/lib/i18n";
import { clearPendingAnalysis } from "@/lib/session";
import type { Case } from "@/lib/types";

export default function CaseWaitingPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const { t, lang } = useLang();
  const router = useRouter();

  const [c, setC] = useState<Case | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [guardianUrl, setGuardianUrl] = useState("");

  useEffect(() => {
    // window.location is unavailable during SSR, so this is deferred to an
    // effect rather than a lazy useState initializer to avoid a hydration
    // mismatch on the readonly input below.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuardianUrl(`${window.location.origin}/guardian/${caseId}`);

    const source = new EventSource(`/api/relay/${caseId}/stream`);
    source.onmessage = (evt) => {
      const data = JSON.parse(evt.data) as Case;
      setC(data);
    };
    source.addEventListener("config_error", (evt) => {
      const data = JSON.parse((evt as MessageEvent).data) as { error: string };
      setConfigError(data.error);
    });
    source.onerror = () => {
      // EventSource auto-retries; also poll once as a fallback.
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
    };
    return () => source.close();
  }, [caseId]);

  if (configError) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <p className="max-w-md text-sm font-semibold text-amber-700">{configError}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tap-target rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          {t("home")}
        </button>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <p className="text-lg font-semibold text-slate-700">{t("caseNotFound")}</p>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="tap-target rounded-full bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          {t("home")}
        </button>
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

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
      <motion.header
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-4"
      >
        <h1 className="text-xl font-extrabold text-slate-900">{t("appName")}</h1>
        <LanguageToggle />
      </motion.header>

      <AnimatePresence mode="wait">
      {!resolved ? (
        <motion.section
          key="waiting"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative overflow-hidden flex flex-col items-center gap-6 rounded-3xl glass-panel p-6 sm:p-9 text-center shadow-xl ring-1 ring-slate-900/5"
        >
          {/* Animated Radar Beacon */}
          <div className="relative flex items-center justify-center my-2">
            <div className="absolute h-32 w-32 rounded-full bg-amber-400/20 animate-radar" />
            <div className="absolute h-24 w-24 rounded-full bg-amber-400/30 animate-ping" />
            <div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-lg shadow-amber-500/30 ring-4 ring-amber-300/60">
              <Loader2 className="h-9 w-9 animate-spin" />
            </div>
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className={`text-2xl font-black text-slate-950 sm:text-3xl ${lang === "ur" ? "font-urdu text-3xl" : ""}`}>
              {t("waitingTitle")}
            </h2>
            <p className={`text-sm text-slate-600 leading-relaxed ${lang === "ur" ? "font-urdu text-base" : ""}`}>
              {t("waitingSubtitle")}
            </p>
          </div>

          {/* Shareable Guardian Box */}
          <div className="w-full rounded-2xl bg-slate-100/80 p-5 text-left ring-1 ring-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {t("shareLinkLabel")}
              </p>
              <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                Protected Link
              </span>
            </div>

            {/* Input & Copy */}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={guardianUrl}
                className="min-w-0 flex-1 truncate rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono text-slate-700 select-all"
              />
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(guardianUrl);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="tap-target inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-slate-800 transition-all shrink-0"
              >
                <Copy className="h-4 w-4" />
                <span>{copied ? t("copied") : t("copyLink")}</span>
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-2">
              {/* WhatsApp 1-tap share */}
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  `Assalam-o-Alaikum! Please review this suspicious message request for me on SAATHI:\n${guardianUrl}`,
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="tap-target flex items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-xs sm:text-sm font-bold text-white shadow-sm hover:bg-[#20bd5a] transition-all"
              >
                <span>💬 {t("shareWhatsApp")}</span>
              </a>

              {/* Demo Split Screen Helper */}
              <button
                type="button"
                onClick={() => window.open(guardianUrl, "_blank")}
                className="tap-target flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-800 shadow-xs ring-1 ring-slate-300 hover:bg-slate-50 transition-all"
              >
                <ExternalLink className="h-4 w-4 text-slate-500" />
                <span>{t("openSplit")}</span>
              </button>
            </div>

            {/* Scan-to-join QR code for judges/demos to act as Guardian live */}
            <GuardianQrCode url={guardianUrl} />
          </div>
        </motion.section>
      ) : (
        <motion.div
          key="resolved"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 22 }}
          className="flex flex-col gap-6"
        >
          <VerdictBanner
            riskLevel={c.guardianDecision === "STOP" ? "STOP" : "SAFE"}
            reason={c.guardianDecision === "STOP" ? t("guardianRespondedStop") : t("guardianRespondedSafe")}
          />

          <div className="flex items-start gap-4 rounded-3xl glass-panel p-6 shadow-md ring-1 ring-slate-900/5">
            <div className={`p-3 rounded-2xl shrink-0 ${c.guardianDecision === "STOP" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
              {c.guardianDecision === "STOP" ? (
                <ShieldAlert className="h-8 w-8" />
              ) : (
                <ShieldCheck className="h-8 w-8" />
              )}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-950">
                {c.guardianDecision === "STOP" ? "Guardian Protection Active" : "Guardian Verification Confirmed"}
              </h3>
              <p className={`mt-1 text-sm sm:text-base font-medium text-slate-700 ${lang === "ur" ? "font-urdu text-lg" : ""}`}>
                {c.guardianDecision === "STOP" ? t("guardianNoMoneySent") : t("guardianOkProceed")}
              </p>
            </div>
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              clearPendingAnalysis();
              router.push("/");
            }}
            className="tap-target rounded-2xl bg-gradient-to-r from-slate-950 to-indigo-950 px-6 py-4 text-lg font-black text-white shadow-xl shadow-slate-950/20 ring-2 ring-slate-800 hover:from-slate-900"
          >
            {t("startOver")}
          </motion.button>
        </motion.div>
      )}
      </AnimatePresence>

    </main>
  );
}
