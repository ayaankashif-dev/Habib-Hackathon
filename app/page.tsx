"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  Camera,
  Check,
  ClipboardPaste,
  FileAudio,
  Loader2,
  LogIn,
  LogOut,
  Mic,
  Radio,
  ShieldCheck,
  Sparkles,
  Square,
  Trash2,
  UploadCloud,
  User,
  UserRoundCog,
} from "lucide-react";
import LanguageToggle from "@/components/LanguageToggle";
import GuardianSettingsModal from "@/components/GuardianSettingsModal";
import AudioGuidance from "@/components/AudioGuidance";
import ThreatTicker from "@/components/ThreatTicker";
import NotificationBanner from "@/components/NotificationBanner";
import { useAuth } from "@/lib/authContext";
import { useLang } from "@/lib/i18n";
import { demoScenarios } from "@/lib/demoScenarios";
import { savePendingAnalysis } from "@/lib/session";
import { checkAndRecordPattern } from "@/lib/patternMemory";
import { loadGuardianProfile, type GuardianProfile } from "@/lib/guardianProfile";
import type { InputType } from "@/lib/types";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: unknown) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognition(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export default function Home() {
  const { t, lang } = useLang();
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  const [activeTab, setActiveTab] = useState<"text" | "screenshot" | "voice">("text");
  const [text, setText] = useState("");
  const [inputType, setInputType] = useState<InputType>("text");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<"none" | "checking" | "ocr" | "listening" | "transcribing">("none");
  const [error, setError] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState(false);
  const [senderContact, setSenderContact] = useState("");
  const [showGuardianSettings, setShowGuardianSettings] = useState(false);
  const [guardianProfile, setGuardianProfile] = useState<GuardianProfile | null>(null);

  useEffect(() => {
    // localStorage only exists client-side, so this can't be a lazy
    // useState initializer without risking an SSR/hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuardianProfile(loadGuardianProfile());
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  // Clean up object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  async function handleScreenshot(file: File) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setBusy("ocr");
    setError(null);
    try {
      const form = new FormData();
      form.append("image", file);
      const res = await fetch("/api/ocr", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "OCR failed");
      setText((prev) => (prev ? `${prev}\n${data.text}` : data.text));
      setInputType("screenshot");
    } catch {
      setError(t("aiUnavailable"));
    } finally {
      setBusy("none");
    }
  }

  async function handleVoiceFile(file: File) {
    setBusy("transcribing");
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");
      setText((prev) => (prev ? `${prev}\n${data.text}` : data.text));
      setInputType("voice");
    } catch {
      setError(t("transcriptionUnavailable"));
    } finally {
      setBusy("none");
    }
  }

  function toggleVoice() {
    if (busy === "listening") {
      recognitionRef.current?.stop();
      return;
    }
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError(t("aiUnavailable"));
      return;
    }
    const recognition = new Recognition();
    recognition.lang = lang === "en" ? "en-US" : "ur-PK";
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const e = event as { results: ArrayLike<{ 0: { transcript: string } }> };
      let transcript = "";
      for (let i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript + " ";
      }
      setText((prev) => (prev ? `${prev}\n${transcript.trim()}` : transcript.trim()));
      setInputType("voice");
    };
    recognition.onerror = () => setBusy("none");
    recognition.onend = () => setBusy("none");
    recognitionRef.current = recognition;
    setBusy("listening");
    recognition.start();
  }

  async function handlePaste() {
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        const clipText = await navigator.clipboard.readText();
        if (clipText) {
          setText(clipText);
          setInputType("text");
          setCopiedNotification(true);
          setTimeout(() => setCopiedNotification(false), 2000);
        }
      }
    } catch {
      // ignore
    }
  }

  async function handleCheck() {
    if (!text.trim()) return;
    setBusy("checking");
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text, lang }),
      });
      const analysis = await res.json();
      const repeatedPattern = checkAndRecordPattern(text, analysis.riskLevel);
      savePendingAnalysis({
        text,
        inputType,
        analysis,
        repeatedPattern,
        senderContact: senderContact.trim() || undefined,
      });
      router.push("/verdict");
    } catch {
      setError(t("aiUnavailable"));
    } finally {
      setBusy("none");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <NotificationBanner />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-6 sm:py-10">
        {/* Top Header Bar */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3.5">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="flex h-13 w-13 items-center justify-center rounded-2xl bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 text-white shadow-md ring-1 ring-white/20"
            >
              <ShieldCheck aria-hidden className="h-7 w-7 text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950">{t("appName")}</h1>
              <p className="text-xs font-semibold text-slate-500">{t("tagline")}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-full bg-red-50 text-red-700 hover:bg-red-100 border border-red-200/80 px-3 py-1.5 text-xs font-bold transition shadow-2xs"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse text-red-600" />
              <span className="hidden sm:inline">Scam Radar</span>
            </Link>
            <LanguageToggle />
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div
                  title={user.email || user.displayName || "User"}
                  className="h-8 w-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold"
                >
                  {user.displayName ? user.displayName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : <User className="w-4 h-4" />)}
                </div>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Log out"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </motion.header>

      {/* Utility bar: audio welcome + saved trusted-person shortcut */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="flex flex-wrap items-center gap-2"
      >
        <AudioGuidance />
        <button
          type="button"
          onClick={() => setShowGuardianSettings(true)}
          className="tap-target flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-200"
        >
          <UserRoundCog className="h-4 w-4" />
          <span className="max-w-[10rem] truncate">
            {guardianProfile ? guardianProfile.name : t("setGuardianProfile")}
          </span>
        </button>
      </motion.div>

      {/* Main Intake Console */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="relative overflow-hidden rounded-3xl glass-panel p-5 sm:p-7 shadow-xl ring-1 ring-slate-900/5"
      >
        {/* Title & Micro Tag */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-black text-slate-950 sm:text-2xl ${lang === "ur" ? "font-urdu text-2xl" : ""}`}>
              {t("intakeTitle")}
            </h2>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full ring-1 ring-indigo-200">
              <Sparkles className="h-3 w-3" />
              100% Private & Safe
            </span>
          </div>
          <p className={`text-sm text-slate-500 ${lang === "ur" ? "font-urdu" : ""}`}>{t("intakeSubtitle")}</p>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/60 p-1.5 ring-1 ring-slate-300/60">
          <button
            type="button"
            onClick={() => setActiveTab("text")}
            className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "text" ? "text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "text" && (
              <motion.span
                layoutId="active-input-tab"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <span className="relative z-10">{t("tabText")}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("screenshot");
              if (!text && fileInputRef.current) fileInputRef.current.click();
            }}
            className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "screenshot" ? "text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "screenshot" && (
              <motion.span
                layoutId="active-input-tab"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <Camera className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10">{t("tabScreenshot")}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("voice")}
            className={`relative flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl text-xs sm:text-sm font-bold transition-colors ${
              activeTab === "voice" ? "text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {activeTab === "voice" && (
              <motion.span
                layoutId="active-input-tab"
                className="absolute inset-0 rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5"
                transition={{ type: "spring", stiffness: 450, damping: 32 }}
              />
            )}
            <Mic className="relative z-10 h-4 w-4 shrink-0" />
            <span className="relative z-10">{t("tabVoice")}</span>
          </button>
        </div>

        {/* Tab 1: Text Mode */}
        {activeTab === "text" && (
          <div className="mt-4">
            <div className="relative">
              <textarea
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setInputType("text");
                }}
                placeholder={t("inputPlaceholder")}
                rows={5}
                dir={lang === "ur" ? "rtl" : "ltr"}
                className={`w-full resize-none rounded-2xl border border-slate-200/90 bg-white/95 p-4 text-base sm:text-lg text-slate-900 outline-none transition-all focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/10 ${
                  lang === "ur" ? "font-urdu text-xl" : ""
                }`}
              />

              {/* Utility actions in bottom corner */}
              <div className="mt-2 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePaste}
                    className="tap-target inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-200"
                  >
                    {copiedNotification ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <ClipboardPaste className="h-3.5 w-3.5" />}
                    <span>{copiedNotification ? "Pasted!" : t("pasteClipboard")}</span>
                  </button>

                  {text && (
                    <button
                      type="button"
                      onClick={() => {
                        setText("");
                        setImagePreview(null);
                      }}
                      className="tap-target inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t("clearText")}</span>
                    </button>
                  )}
                </div>

                <span className="text-xs font-medium text-slate-400">
                  {text.length > 0 && `${text.length} chars`}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Screenshot OCR Mode */}
        {activeTab === "screenshot" && (
          <div className="mt-4 space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleScreenshot(f);
                e.target.value = "";
              }}
            />

            {/* Drag & Drop Upload Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-white/70 p-6 text-center cursor-pointer transition-all hover:border-indigo-500 hover:bg-indigo-50/30"
            >
              {imagePreview ? (
                <div className="relative w-full max-h-56 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Uploaded screenshot"
                    className="max-h-56 object-contain rounded-lg"
                  />
                  {busy === "ocr" && (
                    <div className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                      {/* Laser Beam */}
                      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#38bdf8] animate-laser" />
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-2" />
                      <p className="text-sm font-bold tracking-wide">{t("reading")}</p>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-700 mb-3">
                    <UploadCloud className="h-7 w-7" />
                  </div>
                  <p className="text-sm font-bold text-slate-800">{t("dropScreenshot")}</p>
                  <p className="text-xs text-slate-500 mt-1">Supports WhatsApp chats, SMS screenshots, photo of message</p>
                </>
              )}
            </div>

            {text && (
              <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-200/70">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Extracted Text
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check className="h-3 w-3" /> OCR Ready
                  </span>
                </div>
                <p className="text-sm text-slate-700 line-clamp-3 font-mono">{text}</p>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Voice Note Mode */}
        {activeTab === "voice" && (
          <div className="mt-4 flex flex-col items-center justify-center py-4 space-y-4">
            <div className="relative">
              {busy === "listening" && (
                <div className="absolute -inset-4 rounded-full bg-red-500/20 animate-ping pointer-events-none" />
              )}
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleVoice}
                className={`tap-target relative z-10 flex h-20 w-20 items-center justify-center rounded-full shadow-lg transition-all ${
                  busy === "listening"
                    ? "bg-red-600 text-white pulse-stop"
                    : "bg-gradient-to-tr from-slate-900 to-indigo-900 text-white hover:from-slate-800"
                }`}
              >
                {busy === "listening" ? (
                  <Square className="h-8 w-8" />
                ) : (
                  <Mic className="h-8 w-8 text-emerald-400" />
                )}
              </motion.button>
            </div>

            <div className="text-center">
              <p className="text-base font-bold text-slate-900">
                {busy === "listening" ? t("liveListening") : t("recordVoice")}
              </p>
              {busy === "listening" && (
                <div className="mt-2 flex items-center justify-center gap-1 text-red-600">
                  <span className="w-1.5 rounded-full bg-red-600 animate-bar-1" />
                  <span className="w-1.5 rounded-full bg-red-600 animate-bar-2" />
                  <span className="w-1.5 rounded-full bg-red-600 animate-bar-3" />
                  <span className="w-1.5 rounded-full bg-red-600 animate-bar-4" />
                  <span className="w-1.5 rounded-full bg-red-600 animate-bar-5" />
                </div>
              )}
            </div>

            {/* Secondary Option: Upload Audio File */}
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleVoiceFile(f);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => audioInputRef.current?.click()}
              disabled={busy !== "none"}
              className="tap-target inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
            >
              {busy === "transcribing" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileAudio className="h-4 w-4 text-indigo-600" />
              )}
              <span>{busy === "transcribing" ? t("transcribing") : t("uploadVoiceNote")}</span>
            </button>

            {text && (
              <div className="w-full rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Transcribed Message
                </span>
                <p className="text-sm text-slate-800 line-clamp-3">{text}</p>
              </div>
            )}
          </div>
        )}

        {/* Error notification */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 p-3.5 text-xs font-bold text-red-700 ring-1 ring-red-200"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Optional Sender Origin Input */}
        <div className="mt-4 rounded-2xl bg-slate-100/80 p-3.5 border border-slate-200/80">
          <label className="block text-xs font-bold text-slate-700 mb-1">
            Sender Number or Email <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            type="text"
            value={senderContact}
            onChange={(e) => setSenderContact(e.target.value)}
            placeholder="e.g. 0300 1234567, 8171, or scammer@fakebank.com"
            className="w-full px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            If this message is identified as a scam, we can save this sender to help alert others on the Scam Radar.
          </p>
        </div>

        {/* Primary CTA Check Button */}
        <motion.button
          type="button"
          onClick={handleCheck}
          disabled={!text.trim() || busy !== "none"}
          whileHover={!text.trim() || busy !== "none" ? undefined : { scale: 1.02 }}
          whileTap={!text.trim() || busy !== "none" ? undefined : { scale: 0.97 }}
          className="tap-target relative mt-5 flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 px-6 py-4 text-lg font-black text-white shadow-xl shadow-slate-950/25 ring-2 ring-slate-800/80 hover:from-slate-900 hover:to-indigo-900 disabled:opacity-40"
        >
          {/* Shimmer sweep effect */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

          {busy === "checking" ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
              <span>{t("checking")}</span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <span>{t("checkButton")}</span>
            </>
          )}
        </motion.button>
      </motion.section>

      {/* Scripted Scenarios Showcase */}
      <motion.section
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }}
        className="space-y-3"
      >
        <div className="flex items-center justify-between px-1">
          <p className={`text-xs font-bold uppercase tracking-wider text-slate-500 ${lang === "ur" ? "font-urdu text-sm" : ""}`}>
            {t("tryExample")}
          </p>
          <span className="text-[11px] font-semibold text-slate-400">1-Tap Live Demo</span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {demoScenarios.map((s, idx) => {
            const badge =
              idx === 0
                ? { label: "Family Emergency", bg: "bg-red-100 text-red-800" }
                : idx === 1
                  ? { label: "Job Scam", bg: "bg-amber-100 text-amber-800" }
                  : { label: "Bank OTP", bg: "bg-rose-100 text-rose-800" };

            return (
              <motion.button
                key={s.id}
                type="button"
                variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setText(s.text);
                  setInputType(s.inputType);
                  setActiveTab("text");
                }}
                className="tap-target flex flex-col items-start rounded-2xl glass-panel p-4 text-left shadow-xs ring-1 ring-slate-900/5 transition-all hover:bg-white hover:shadow-md"
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${badge.bg}`}>
                    {badge.label}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">#{idx + 1}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 leading-snug">{t(s.labelKey)}</p>
                <p className="mt-1 text-xs text-slate-500 line-clamp-2 leading-relaxed">
                  {s.text}
                </p>
              </motion.button>
            );
          })}
        </div>
      </motion.section>

      {/* Pakistan Cyber Threat Radar */}
      <ThreatTicker />

      {/* Safety Footer */}
      <footer className="mt-auto pt-6 text-center text-xs font-medium text-slate-400">
        <p>{t("footerNote")}</p>
      </footer>

      <GuardianSettingsModal
        open={showGuardianSettings}
        onClose={() => setShowGuardianSettings(false)}
        onSaved={() => setGuardianProfile(loadGuardianProfile())}
      />
      </main>
    </>
  );
}
